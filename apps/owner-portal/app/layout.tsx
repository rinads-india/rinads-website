import type { Metadata } from "next";
import { OwnerNav } from "@/components/OwnerNav";
import { DEMO_OWNER_ROLE } from "@/lib/commerce";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ambady Owner Portal",
  description: "Ambady organization owner portal — catalog, orders, and support.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <OwnerNav role={DEMO_OWNER_ROLE} />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
