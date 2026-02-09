import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import { MainNav } from "@/components/main-nav";
import "./globals.css";

const heading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Ruleset AI Product UI",
  description: "Top-tier UI/UX blueprint with mock marketplace data for business-first product design.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${heading.variable} ${body.variable}`}>
        <div className="ambient" aria-hidden="true" />
        <header className="siteHeader">
          <div className="brandBlock">
            <p className="brandEyebrow">Ruleset AI</p>
            <h1>Product Experience Studio</h1>
          </div>
          <MainNav />
        </header>
        <main className="siteMain">{children}</main>
      </body>
    </html>
  );
}
