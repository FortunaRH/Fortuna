import { FortunaDemo } from "@/components/FortunaDemo";

export const metadata = { title: "Test - Fortuna" };

export default function TestPage() {
  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="font-display text-3xl text-white">Test Fortuna</h1>
        <p className="mt-2 text-white/60">
          An off-chain walkthrough of commit-reveal randomness — no wallet or gas needed.
        </p>
      </header>
      <FortunaDemo />
    </div>
  );
}
