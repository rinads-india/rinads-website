import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { RinpoProvider } from "@/components/rinpo/RinpoProvider";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RINADS | Business Simplified",
  description: "RINADS Technologies - AI-powered automation, custom software, digital marketing. RINPO-assisted experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${figtree.variable} font-sans antialiased min-h-screen`}>
        <RinpoProvider>
          {children}
        </RinpoProvider>
      </body>
    </html>
  );
}
