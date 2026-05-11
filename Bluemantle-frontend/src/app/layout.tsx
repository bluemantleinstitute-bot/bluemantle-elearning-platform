import type { Metadata } from "next";
import "./globals.css";
import { DNABackground } from "@/components/DNABackground";
import { SecurityGuard } from "@/components/SecurityGuard";

export const metadata: Metadata = {
  title: "Academic Atelier - Bluemantle",
  description: "Ultra-Premium eLearning Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-inter antialiased bg-surface text-on_surface">
        <SecurityGuard>
          <DNABackground />
          {children}
        </SecurityGuard>
      </body>
    </html>
  );
}
