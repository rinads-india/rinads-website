import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { StoreHeader } from "@/components/StoreHeader";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ambady Storefront",
  description: "Ambady premium landscaping products — powered by RINADS commerce.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} min-h-screen antialiased`}>
        <StoreHeader />
        <main className="mx-auto max-w-6xl px-4 py-8 pb-24">{children}</main>
      </body>
    </html>
  );
}
