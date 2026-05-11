import type { Metadata } from "next";
import "./globals.css";
import { ClientOnlyDNABackground } from "@/components/ClientOnlyDNABackground";
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
          <ClientOnlyDNABackground />
          {children}
        </SecurityGuard>
      </body>
    </html>
  );
}
