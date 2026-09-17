"use client";

import dynamic from "next/dynamic";

const Landing3D = dynamic(() => import("@/components/Landing3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-black text-lg text-white/40">
      LOADING...
    </div>
  ),
});

export default function LandingPage() {
  return <Landing3D />;
}