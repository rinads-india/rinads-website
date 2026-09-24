import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "R GLOW — Owner & Staff Console",
  description: "R GLOW Salon OS owner and staff console — branches, services, staff, clients, and appointments.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} min-h-screen bg-background font-sans antialiased`}>{children}</body>
    </html>
  );
}
