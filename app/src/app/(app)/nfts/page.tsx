import { NftGallery } from "@/components/NftGallery";

export const metadata = { title: "NFTs - Fortuna" };

export default function NftsPage() {
  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="font-display text-3xl text-white">Your NFTs</h1>
        <p className="mt-2 text-white/60">A fixed Braille portrait, tinted per token.</p>
      </header>
      <NftGallery />
    </div>
  );
}
