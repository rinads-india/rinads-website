import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { OwnerNav } from "@/components/OwnerNav";
import { DEMO_OWNER_ROLE } from "@/lib/commerce";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ambady Owner Portal",
  description: "Ambady organization owner portal — catalog, orders, and support.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} min-h-screen bg-background antialiased`}>
        <OwnerNav role={DEMO_OWNER_ROLE} />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
