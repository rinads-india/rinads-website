import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "R GLOW — Owner & Staff Console",
  description: "R GLOW Salon OS owner and staff console — branches, services, staff, clients, and appointments.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
