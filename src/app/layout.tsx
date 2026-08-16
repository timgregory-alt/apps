import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { BottomNav } from "@/components/layout/BottomNav";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
  title: "Tennessee Wine Passport",
  description: "Four wineries. One Tennessee wine adventure.",
  applicationName: "Tennessee Wine Passport",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TN Wine Passport",
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
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-dvh antialiased">
        <div className="pb-24">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
