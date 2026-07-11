import type { Metadata } from "next";
import { Inter, Source_Serif_4, Geist_Mono, Unbounded } from "next/font/google";
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
const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://dossimo.app",
);

const TITRE = "Dossimo · dossiers MaPrimeRénov' & CEE conformes";
const DESCRIPTION =
  "Dossimo aide les artisans RGE indépendants à produire des dossiers MaPrimeRénov' et CEE conformes et anti-refus, sans mandataire : vous gardez votre client et votre prime.";

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: {
    default: TITRE,
    // Les pages internes n'ont plus à répéter la marque.
    template: "%s · Dossimo",
  },
  description: DESCRIPTION,
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
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "Dossimo",
    title: TITRE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITRE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${sourceSerif.variable} ${geistMono.variable} ${unbounded.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
