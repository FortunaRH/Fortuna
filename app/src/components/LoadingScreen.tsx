"use client";

const LINES = 20;
const STEP_MS = 60;

/**
 * Full-screen boot screen: a looping wave of vertical lines. Each line pulses
 * dark → bright (with glow) → dark with ease-in-out, staggered left→right so the
 * light travels across the row and loops forever.
 */
export default function LoadingScreen({
  label,
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-300 ${className}`}
    >
      <div className="flex items-center gap-2">
        {Array.from({ length: LINES }).map((_, i) => (
          <span
            key={i}
            className="loader-line"
            style={{ animationDelay: `${i * STEP_MS}ms` }}
          />
        ))}
      </div>
      {label ? (
        <div className="mt-10 text-xl tracking-[0.4em] text-white/60">{label}</div>
      ) : null}
    </div>
  );
}
