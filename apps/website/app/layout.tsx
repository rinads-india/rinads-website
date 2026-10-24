import type { Metadata, Viewport } from "next";
import { Caveat, Figtree, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RinpoProvider } from "@/components/rinpo/RinpoProvider";
import { ThemeScript } from "@/components/rinads/ThemeScript";
import { AnalyticsProvider } from "@/components/system/AnalyticsProvider";
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
  title: "RINADS | Business Intelligence Infrastructure",
  description:
    "Business Intelligence Infrastructure for Software-Defined Business. Powered by RINADS INTELLIGENCE. Executed by RINPO RUNTIME.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: siteBrand.name },
  openGraph: {
    title: "RINADS | Business Intelligence Infrastructure",
    description:
      "Business Intelligence Infrastructure for Software-Defined Business. Powered by RINADS INTELLIGENCE. Executed by RINPO RUNTIME.",
    url: siteUrl,
    siteName: siteBrand.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RINADS | Business Intelligence Infrastructure",
    description:
      "Business Intelligence Infrastructure for Software-Defined Business. Powered by RINADS INTELLIGENCE. Executed by RINPO RUNTIME.",
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
            <AnalyticsProvider>
              <RinpoProvider>{children}</RinpoProvider>
            </AnalyticsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
