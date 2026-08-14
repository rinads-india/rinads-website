import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { PortalNav } from "@/components/PortalNav";
import { RouteAwareRinpoPanel } from "@/components/RouteAwareRinpoPanel";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
      <body className={`${figtree.variable} font-sans antialiased`}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <div className="flex min-h-screen flex-col lg:flex-row">
          <div className="lg:w-56 lg:shrink-0">
            <PortalNav />
          </div>
          <main id="main" className="flex-1 p-6 lg:p-8">
            {children}
          </main>
          <div className="lg:w-80 lg:shrink-0">
            <RouteAwareRinpoPanel />
          </div>
        </div>
      </body>
    </html>
  );
}
