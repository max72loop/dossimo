import type { Metadata } from "next";
import { Inter, Source_Serif_4, Geist_Mono, Unbounded } from "next/font/google";
import { MotionProvider } from "@/components/ui/motion-provider";
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

export const metadata: Metadata = {
  title: "Dossimo · dossiers MaPrimeRénov' & CEE conformes",
  description:
    "Dossimo aide les artisans RGE indépendants d'Île-de-France à produire des dossiers MaPrimeRénov' et CEE conformes et anti-refus, sans mandataire.",
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
      <body className="min-h-full flex flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
