// TODO: replace with your public GitHub repo URL once it exists.
const GITHUB_URL = "";

export const metadata = { title: "Docs - Fortuna" };

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.66.41.35.77 1.04.77 2.1 0 1.52-.01 2.74-.01 3.11 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12 24 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="font-display text-3xl text-white">Fortuna</h1>

      <Section title="What is it?">
        <p>
          Fortuna is the randomness layer for Robinhood. Smart contracts ask Fortuna for a random number,
          and Fortuna returns one that anyone can verify — nobody can rig the result.
        </p>
      </Section>

      <Section title="How it works">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <b>Request.</b> Your contract asks Fortuna for randomness.
          </li>
          <li>
            <b>Reveal.</b> A provider who committed a secret ahead of time reveals it on-chain.
          </li>
          <li>
            <b>Verify.</b> Fortuna checks the secret and mixes it with your request, giving a fair,
            verifiable random number.
          </li>
        </ol>
      </Section>

      <Section title="The $FORT token">
        <p>
          $FORT (the Fortune token) is Fortuna's own ERC20 token. You spend it to activate a Glyph,
          and you earn it back when your Glyph earns rewards.
        </p>
      </Section>

      <Section title="Glyph NFTs">
        <p>
          Glyphs are limited-edition NFTs. Only 1,024 will ever exist, and each one is a unique
          portrait drawn fully on-chain — no external servers or image files.
        </p>
      </Section>

      <Section title="Activate & stake">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <b>Activate.</b> Spend $FORT to activate a Glyph. Activation raises its reward rate.
          </li>
          <li>
            <b>Stake.</b> A staked Glyph farms points every second. An activated Glyph also earns
            $FORT on top.
          </li>
          <li>
            <b>Redeem.</b> Redeem an activated Glyph anytime and get the full $FORT you paid to
            activate it back.
          </li>
        </ol>
      </Section>

      <Section title="Where rewards come from">
        <p>
          Rewards are paid from real usage: the fees people pay to use Fortuna's randomness, plus
          trading fees. You're earning a share of what others pay to use the network — not newly
          minted tokens.
        </p>
      </Section>

      <div className="flex items-center gap-3">
        <a
          href={GITHUB_URL || "#"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 border border-white/20 px-5 py-2 text-lg text-white/80 transition hover:border-white/50 hover:text-white"
        >
          <GitHubIcon />
          GitHub
        </a>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-panel p-6">
      <h2 className="font-display text-lg text-neon">{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">{children}</div>
    </section>
  );
}
