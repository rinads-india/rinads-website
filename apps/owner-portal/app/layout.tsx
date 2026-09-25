import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ambady Owner Portal",
  description: "Ambady organization owner portal — catalog, orders, and support.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
