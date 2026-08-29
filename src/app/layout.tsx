import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Cormorant_Garamond } from "next/font/google";
import { BottomNav } from "@/components/layout/BottomNav";
import "./globals.css";

// GlobalTierCelebration is temporarily unmounted here — its per-navigation
// points lookup added load across the whole app and coincided with a
// production outage. Re-add once Supabase load is confirmed stable, ideally
// behind a longer throttle or scoped back to just the Rewards page.

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tennessee Wine Trails",
  description: "Four wineries. One Tennessee wine adventure.",
  applicationName: "Tennessee Wine Trails",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TN Wine Trails",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#faf6ee",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${cormorant.variable}`}>
      <body className="min-h-dvh antialiased">
        <div className="pb-24">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
