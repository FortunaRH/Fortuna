import type { ReactNode } from "react";

/** A CSS CRT television frame — rounded body, scanlined screen, glass glare. */
export function CrtTv({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/15 bg-[#141416] p-3 shadow-2xl ${className}`}>
      <div className="crt-screen rounded-lg bg-black p-4">{children}</div>
      <div className="mt-2 flex items-center justify-between px-1">
        <span className="h-1.5 w-1.5 rounded-full bg-neon glow-green" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">fortuna.crt</span>
      </div>
    </div>
  );
}