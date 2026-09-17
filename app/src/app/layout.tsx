import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { LoadingOverlay } from "@/components/LoadingOverlay";

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fortuna",
  description: "Fortuna - the verifiable randomness layer for Robinhood.",
  icons: {
    icon: "/favicon/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={vt323.variable}>
      <body className="min-h-screen bg-bg text-white antialiased">
        <Providers>{children}</Providers>
        <LoadingOverlay />
      </body>
    </html>
  );
}
