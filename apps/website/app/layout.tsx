import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { RinpoProvider } from "@/components/rinpo/RinpoProvider";
import { siteBrand } from "@/lib/brand";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rinads.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "RINADS | Business Simplified",
  description:
    "RINADS Technologies - AI-powered automation, custom software, digital marketing. RINPO-assisted experience.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: siteBrand.name },
  openGraph: {
    title: "RINADS | Business Simplified",
    description:
      "AI-powered automation, custom software, and digital marketing. Business simplified.",
    url: siteUrl,
    siteName: siteBrand.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RINADS | Business Simplified",
    description:
      "AI-powered automation, custom software, and digital marketing. Business simplified.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: siteBrand.background,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${figtree.variable} font-sans antialiased min-h-screen min-h-[100dvh] overflow-x-hidden overscroll-behavior-none touch-manipulation`}>
        <AuthProvider>
          <RinpoProvider>
            {children}
          </RinpoProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
