import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ambady Customer Portal",
  description: "Manage orders, addresses, wishlist, and support for Ambady.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>{children}</body>
    </html>
  );
}
