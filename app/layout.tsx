import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { RinpoProvider } from "@/components/rinpo/RinpoProvider";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RINADS | Business Simplified",
  description: "RINADS Technologies - AI-powered automation, custom software, digital marketing. RINPO-assisted experience.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "RINADS" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
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
