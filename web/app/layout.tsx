import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-code-sandbox.vercel.app"),
  title: "AI-Code-Sandbox — Secure execution for AI-generated code",
  description:
    "Run untrusted, LLM-generated code safely. Fully isolated ephemeral containers, strict resource limits, and instant cleanup — exposed through a clean API.",
  keywords: ["code execution", "sandbox", "AI agents", "secure", "containers", "LLM tools"],
  icons: { icon: "/logo.png", apple: "/logo.png" },
  openGraph: {
    title: "AI-Code-Sandbox",
    description: "Secure, ephemeral code execution infrastructure for AI agents.",
    type: "website",
    images: [{ url: "/opengraph-image.png", width: 1731, height: 909, alt: "AI-Code-Sandbox" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Code-Sandbox",
    description: "Secure, ephemeral code execution infrastructure for AI agents.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="grain min-h-screen font-sans">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
