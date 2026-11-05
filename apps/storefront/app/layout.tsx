import type { Metadata } from "next";
import "./globals.css";
import { StoreHeader } from "@/components/StoreHeader";

export const metadata: Metadata = {
  title: "Ambady Storefront",
  description: "Ambady premium landscaping products — powered by RINADS commerce.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`min-h-screen antialiased`}>
        <StoreHeader />
        <main className="mx-auto max-w-6xl px-4 py-8 pb-24">{children}</main>
      </body>
    </html>
  );
}
