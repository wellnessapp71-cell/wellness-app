import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aura Care OS",
  description: "Employee wellness app, HR intelligence workspace, and psychologist operations portal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#EAF2F5] font-sans antialiased selection:bg-[#167C80]/20 selection:text-[#167C80]">
        {children}
      </body>
    </html>
  );
}
