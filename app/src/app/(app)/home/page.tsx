import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import ScrambledText from "@/components/ScrambledText";
import DecryptedText from "@/components/DecryptedText";
import { AsciiArtCycler } from "@/components/AsciiArtCycler";

const ART_FILES = [
  "ascii_blindfoldedwomant.txt",
  "ascii_blindfoldedwomant_d.txt",
];

const FRAMES = ART_FILES.map((f) =>
  readFileSync(join(process.cwd(), "assets", f), "utf8").trimEnd(),
);

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="pt-8">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_auto_1fr] md:gap-10">
          <div className="text-center md:text-right">
            <ScrambledText
              as="h1"
              radius={120}
              duration={1}
              className="text-5xl leading-none text-white md:text-6xl"
            >
              FORTUNA
            </ScrambledText>
          </div>

          <div className="order-first mx-auto w-fit max-w-full overflow-x-auto px-4 py-4 md:order-none">
            <AsciiArtCycler frames={FRAMES} />
          </div>

          <div className="text-center md:text-left">
            <ScrambledText
              as="p"
              radius={90}
              duration={1}
              className="text-xl text-neon md:text-2xl"
            >
              THE RANDOMNESS LAYER FOR ROBINHOOD.
            </ScrambledText>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-6">
          <Link
            href="/test"
            className="bg-white px-7 py-2 text-xl text-black transition hover:bg-white/80"
          >
            <DecryptedText
              text="Test Fortuna"
              speed={50}
              maxIterations={5}
              sequential
              encryptedClassName="opacity-50"
            />
          </Link>
          <Link
            href="/docs"
            className="border border-white/20 px-7 py-2 text-xl text-white/70 transition hover:border-white/50 hover:text-white"
          >
            <DecryptedText text="Read the docs" speed={50} maxIterations={5} sequential encryptedClassName="opacity-50" />
          </Link>
        </div>
      </section>

      <section className="text-center text-lg text-white/40">
        <span className="animate-blink">_</span> system ready - awaiting entropy
      </section>
    </div>
  );
}
