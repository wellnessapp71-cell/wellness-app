import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Aura — Wellness Platform",
  description: "Your holistic wellness journey begins here.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-[#000000] sm:bg-[#E5E5EA] min-h-screen selection:bg-[#FF2D55]/20 selection:text-[#FF2D55] sm:flex sm:flex-col sm:justify-center overflow-hidden">
        {children}
      </body>
    </html>
  );
}
