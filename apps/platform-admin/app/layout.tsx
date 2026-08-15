import type { Metadata } from "next";
import { PlatformNav } from "@/components/PlatformNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "RINADS Platform Admin",
  description: "Multi-tenant SaaS control plane — provision, suspend, and audit tenants.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <PlatformNav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
