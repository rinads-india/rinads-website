import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RinpoProvider } from "@/components/rinpo/RinpoProvider";
import { ThemeScript } from "@/components/rinads/ThemeScript";
import { AnalyticsProvider } from "@/components/system/AnalyticsProvider";
import { siteBrand } from "@/lib/brand";

// Typography is loaded through CSS with resilient system fallbacks. Building this
// public website must not depend on Google Fonts responses from next/font/google.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rinads.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "RINADS | Business, simplified.",
  description:
    "Run, sell, grow and automate your business from one intelligent platform with RINPO. Business Intelligence Platform for growing businesses.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: siteBrand.name },
  openGraph: {
    title: "RINADS | Business, simplified.",
    description:
      "Run, sell, grow and automate your business from one intelligent platform with RINPO. Business Intelligence Platform for growing businesses.",
    url: siteUrl,
    siteName: siteBrand.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RINADS | Business, simplified.",
    description:
      "Run, sell, grow and automate your business from one intelligent platform with RINPO. Business Intelligence Platform for growing businesses.",
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
        className="font-sans antialiased bg-background text-foreground overflow-x-hidden"
      >
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <AnalyticsProvider>
              <RinpoProvider>{children}</RinpoProvider>
            </AnalyticsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
