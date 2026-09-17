"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "./ConnectButton";
import DecryptedText from "./DecryptedText";

const links = [
  { href: "/home", label: "HOME" },
  { href: "/nfts", label: "NFTS" },
  { href: "/test", label: "TEST" },
  { href: "/docs", label: "DOCS" },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl text-white">
          FORTUNA<span className="animate-blink">_</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-base transition hover:text-white ${
                pathname === l.href ? "text-white underline" : "text-white/50"
              }`}
            >
              <DecryptedText
                text={l.label}
                speed={50}
                maxIterations={5}
                sequential
                encryptedClassName="opacity-40"
              />
            </Link>
          ))}
        </nav>
        <ConnectButton />
      </div>
    </header>
  );
}
