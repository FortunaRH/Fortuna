"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { finishLoading, getDestination, subscribeLoading } from "@/lib/loadingStore";
import LoadingScreen from "./LoadingScreen";

// Keep the overlay up long enough to see at least one wave loop, then fade 300ms.
const MIN_VISIBLE_MS = 1300;
const FADE_MS = 300;

/**
 * Global navigation overlay. Appears immediately on startLoading() and stays visible
 * (even across the route switch, e.g. during dev-mode compilation) until the
 * destination pathname has actually mounted, then fades out.
 */
export function LoadingOverlay() {
  // getServerSnapshot returns null so SSR/prerender never renders the overlay.
  const destination = useSyncExternalStore(subscribeLoading, getDestination, () => null);
  const pathname = usePathname();
  const [phase, setPhase] = useState<"hidden" | "visible" | "fading">("hidden");
  const [arrived, setArrived] = useState(false);
  const startedAtRef = useRef(0);

  // Show immediately when a load starts; hide once the store clears.
  useEffect(() => {
    if (destination) {
      startedAtRef.current = performance.now();
      setArrived(false);
      setPhase("visible");
    } else {
      setPhase("hidden");
    }
  }, [destination]);

  // Mark arrival once the destination route has mounted.
  useEffect(() => {
    if (destination && pathname === destination) setArrived(true);
  }, [destination, pathname]);

  // Fade out only after the wave has had time to play (or the route is ready,
  // whichever is later), then clear the store.
  useEffect(() => {
    if (!arrived) return;
    const elapsed = performance.now() - startedAtRef.current;
    const fadeIn = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const fadeId = setTimeout(() => setPhase("fading"), fadeIn);
    const doneId = setTimeout(() => finishLoading(), fadeIn + FADE_MS);
    return () => {
      clearTimeout(fadeId);
      clearTimeout(doneId);
    };
  }, [arrived]);

  if (phase === "hidden") return null;

  const label = destination ? destination.replace(/^\//, "").toUpperCase() : undefined;

  return (
    <LoadingScreen label={label} className={phase === "fading" ? "opacity-0" : "opacity-100"} />
  );
}
