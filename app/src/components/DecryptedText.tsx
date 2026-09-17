"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const styles = {
  wrapper: {
    display: "inline-block",
    whiteSpace: "pre-wrap",
  } as const,
  srOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    border: 0,
    visibility: "hidden",
  } as const,
};

type DecryptedTextProps = {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: "hover" | "click" | "view" | "inViewHover";
  clickMode?: "once" | "toggle";
} & Omit<React.HTMLAttributes<HTMLSpanElement>, "children">;

/**
 * Dependency-free port of the "DecryptedText" scramble/decrypt effect.
 * The only change from the motion/react reference: `motion.span` -> `span`.
 */
export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
  className = "",
  parentClassName = "",
  encryptedClassName = "",
  animateOn = "hover",
  clickMode = "once",
  ...props
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(animateOn !== "click");
  const [direction, setDirection] = useState<"forward" | "reverse">("forward");

  const containerRef = useRef<HTMLSpanElement>(null);
  const orderRef = useRef<number[]>([]);
  const pointerRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const availableChars = useMemo(() => {
    return useOriginalCharsOnly
      ? Array.from(new Set(text.split(""))).filter((char) => char !== " ")
      : characters.split("");
  }, [useOriginalCharsOnly, text, characters]);

  const shuffleText = useCallback(
    (originalText: string, currentRevealed: Set<number>) => {
      return originalText
        .split("")
        .map((char, i) => {
          if (char === " ") return " ";
          if (currentRevealed.has(i)) return originalText[i];
          return availableChars[Math.floor(Math.random() * availableChars.length)];
        })
        .join("");
    },
    [availableChars],
  );

  const computeOrder = useCallback(
    (len: number) => {
      const order: number[] = [];
      if (len <= 0) return order;
      if (revealDirection === "start") {
        for (let i = 0; i < len; i++) order.push(i);
        return order;
      }
      if (revealDirection === "end") {
        for (let i = len - 1; i >= 0; i--) order.push(i);
        return order;
      }
      const middle = Math.floor(len / 2);
      let offset = 0;
      while (order.length < len) {
        if (offset % 2 === 0) {
          const idx = middle + offset / 2;
          if (idx >= 0 && idx < len) order.push(idx);
        } else {
          const idx = middle - Math.ceil(offset / 2);
          if (idx >= 0 && idx < len) order.push(idx);
        }
        offset++;
      }
      return order.slice(0, len);
    },
    [revealDirection],
  );

  const fillAllIndices = useCallback(() => {
    const s = new Set<number>();
    for (let i = 0; i < text.length; i++) s.add(i);
    return s;
  }, [text]);

  const encryptInstantly = useCallback(() => {
    const emptySet = new Set<number>();
    setRevealedIndices(emptySet);
    setDisplayText(shuffleText(text, emptySet));
    setIsDecrypted(false);
  }, [text, shuffleText]);

  const triggerDecrypt = useCallback(() => {
    if (sequential) {
      orderRef.current = computeOrder(text.length);
      pointerRef.current = 0;
      setRevealedIndices(new Set());
    } else {
      setRevealedIndices(new Set());
    }
    setDirection("forward");
    setIsAnimating(true);
  }, [sequential, computeOrder, text.length]);

  const triggerReverse = useCallback(() => {
    if (sequential) {
      orderRef.current = computeOrder(text.length).slice().reverse();
      pointerRef.current = 0;
      setRevealedIndices(fillAllIndices());
      setDisplayText(shuffleText(text, fillAllIndices()));
    } else {
      setRevealedIndices(fillAllIndices());
      setDisplayText(shuffleText(text, fillAllIndices()));
    }
    setDirection("reverse");
    setIsAnimating(true);
  }, [sequential, computeOrder, fillAllIndices, shuffleText, text]);

  useEffect(() => {
    if (!isAnimating) return;

    // Non-sequential (default hover): scramble with ease-out — fast at first,
    // slowing toward the end — for `maxIterations * speed` ms, then settle.
    if (!sequential) {
      const total = maxIterations * speed;
      const start = performance.now();

      const run = () => {
        const elapsed = performance.now() - start;
        if (elapsed >= total) {
          setIsAnimating(false);
          if (direction === "forward") {
            setIsDecrypted(true);
            setDisplayText(text);
          } else {
            setIsDecrypted(false);
          }
          return;
        }
        setDisplayText(shuffleText(text, new Set()));
        const progress = elapsed / total;
        const eased = 1 - Math.pow(1 - progress, 2); // quadratic ease-out
        const delay = speed * (1 + eased); // grows from `speed` to 2x `speed`
        intervalRef.current = setTimeout(run, delay);
      };
      run();

      return () => {
        if (intervalRef.current) clearTimeout(intervalRef.current);
      };
    }

    // Sequential: reveal one character at a time in `revealDirection` order.
    const order =
      direction === "forward"
        ? computeOrder(text.length)
        : computeOrder(text.length).slice().reverse();
    orderRef.current = order;
    pointerRef.current = 0;

    if (direction === "forward") {
      // Start with every letter scrambled, then settle them one by one (first
      // letter, then the second, and so on). The reveal is scheduled over a
      // fixed duration on a convex ease-in curve, so it is very fast at the
      // start and each following letter settles more slowly toward the end.
      const len = text.length;
      const revealed = new Set<number>();
      setRevealedIndices(revealed);
      setDisplayText(shuffleText(text, revealed));

      const DURATION = 1000; // exactly 1 second
      const start = performance.now();
      const easeIn = (t: number) => Math.pow(t, 1.5);

      const revealNext = (i: number) => {
        if (i >= len) {
          setDisplayText(text);
          setRevealedIndices(fillAllIndices());
          setIsAnimating(false);
          setIsDecrypted(true);
          return;
        }
        const target = start + DURATION * easeIn((i + 1) / len);
        const delay = Math.max(0, target - performance.now());
        intervalRef.current = setTimeout(() => {
          revealed.add(order[i]);
          setRevealedIndices(new Set(revealed));
          setDisplayText(shuffleText(text, revealed));
          revealNext(i + 1);
        }, delay);
      };
      revealNext(0);
    } else {
      // Reverse (click toggle): scramble one character at a time at a fixed rate.
      const revealed = new Set<number>(fillAllIndices());
      setRevealedIndices(new Set(revealed));
      setDisplayText(shuffleText(text, revealed));
      let i = 0;
      intervalRef.current = setInterval(() => {
        if (i >= order.length) {
          clearInterval(intervalRef.current!);
          setIsAnimating(false);
          setIsDecrypted(false);
          return;
        }
        revealed.delete(order[i++]);
        setRevealedIndices(new Set(revealed));
        setDisplayText(shuffleText(text, revealed));
        if (revealed.size === 0) {
          clearInterval(intervalRef.current!);
          setIsAnimating(false);
          setIsDecrypted(false);
        }
      }, speed);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAnimating, text, speed, maxIterations, sequential, direction, shuffleText, computeOrder, fillAllIndices]);

  const handleClick = () => {
    if (animateOn !== "click") return;
    if (clickMode === "once") {
      if (isDecrypted) return;
      setDirection("forward");
      triggerDecrypt();
    }
    if (clickMode === "toggle") {
      if (isDecrypted) {
        triggerReverse();
      } else {
        setDirection("forward");
        triggerDecrypt();
      }
    }
  };

  const triggerHoverDecrypt = useCallback(() => {
    if (isAnimating) return;
    setRevealedIndices(new Set());
    setIsDecrypted(false);
    setDisplayText(shuffleText(text, new Set()));
    setDirection("forward");
    setIsAnimating(true);
  }, [isAnimating, text, shuffleText]);

  const resetToPlainText = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsAnimating(false);
    setRevealedIndices(new Set());
    setDisplayText(text);
    setIsDecrypted(true);
    setDirection("forward");
  }, [text]);

  useEffect(() => {
    if (animateOn !== "view" && animateOn !== "inViewHover") return;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          triggerDecrypt();
          setHasAnimated(true);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    });

    const currentRef = containerRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [animateOn, hasAnimated, triggerDecrypt]);

  useEffect(() => {
    if (animateOn === "click") {
      encryptInstantly();
    } else {
      setDisplayText(text);
      setIsDecrypted(true);
    }
    setRevealedIndices(new Set());
    setDirection("forward");
  }, [animateOn, text, encryptInstantly]);

  // Trigger hover on the parent container (button/link) so the whole clickable
  // area reacts, not just the text glyphs.
  useEffect(() => {
    if (animateOn !== "hover" && animateOn !== "inViewHover") return;
    const parent = containerRef.current?.parentElement;
    if (!parent) return;
    parent.addEventListener("mouseenter", triggerHoverDecrypt);
    parent.addEventListener("mouseleave", resetToPlainText);
    return () => {
      parent.removeEventListener("mouseenter", triggerHoverDecrypt);
      parent.removeEventListener("mouseleave", resetToPlainText);
    };
  }, [animateOn, triggerHoverDecrypt, resetToPlainText]);

  const animateProps = animateOn === "click" ? { onClick: handleClick } : {};

  return (
    <span
      ref={containerRef}
      className={parentClassName}
      style={styles.wrapper}
      {...animateProps}
      {...props}
    >
      <span style={styles.srOnly}>{displayText}</span>
      <span aria-hidden="true">
        {displayText.split("").map((char, index) => {
          const isRevealedOrDone = revealedIndices.has(index) || (!isAnimating && isDecrypted);
          return (
            <span key={index} className={isRevealedOrDone ? className : encryptedClassName}>
              {char}
            </span>
          );
        })}
      </span>
    </span>
  );
}
