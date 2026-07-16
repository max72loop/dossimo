import type { Metadata } from "next";
import { Inter, Source_Serif_4, Geist_Mono, Unbounded } from "next/font/google";
import { connection } from "next/server";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/seo/site";
import { CaptureSource } from "@/components/tracking/capture-source";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Titres et signature : présence éditoriale, sérieuse, légèrement française.
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Données techniques : montants, dates, numéros de dossier, références.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Marque : le mot-signe « dossimo » (kit logo).
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

/**
 * URL canonique du site. `metadataBase` est indispensable : sans elle, Next ne peut
 * pas résoudre les URLs relatives des images OpenGraph, et tout partage social
 * (LinkedIn, WhatsApp, SMS — les canaux réels entre artisans) affiche une carte vide.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    // Les pages internes n'ont plus à répéter la marque.
    template: "%s · Dossimo",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Dossimo",
  keywords: [
    "MaPrimeRénov'",
    "CEE",
    "artisan RGE",
    "dossier de prime",
    "conformité",
    "anti-refus",
    "rénovation énergétique",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "Dossimo",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // La CSP utilise un nonce unique par requête. Le rendu dynamique permet à
  // Next.js de reporter ce nonce sur tous ses scripts d'hydratation.
  await connection();

  return (
    <html
      lang="fr"
      className={`${inter.variable} ${sourceSerif.variable} ${geistMono.variable} ${unbounded.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <CaptureSource />
        {children}
      </body>
    </html>
  );
}
