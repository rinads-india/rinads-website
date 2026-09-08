import type { Metadata, Viewport } from "next";
import { Caveat, Figtree, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RinpoProvider } from "@/components/rinpo/RinpoProvider";
import { ThemeScript } from "@/components/rinads/ThemeScript";
import { siteBrand } from "@/lib/brand";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter-family",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rinads.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "RINADS | The AI Operating Platform for Business",
  description:
    "Run your business. Build your software. Grow your brand. Automate your operations. Train your people. One intelligent platform powered by RINPO.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: siteBrand.name },
  openGraph: {
    title: "RINADS | The AI Operating Platform for Business",
    description:
      "RINPO is the interface. RINADS Intelligence is the brain. RINADS is the operating platform.",
    url: siteUrl,
    siteName: siteBrand.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RINADS | The AI Operating Platform for Business",
    description:
      "Run, build, grow, learn, and automate — one intelligent platform powered by RINPO.",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${figtree.variable} ${inter.variable} ${caveat.variable} font-sans antialiased bg-background text-foreground overflow-x-hidden`}
      >
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <RinpoProvider>{children}</RinpoProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
