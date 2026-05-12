import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Space_Mono } from "next/font/google";
import CharterTabs from "@/components/charters/CharterTabs";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "600", "700", "900"], variable: "--font-cinzel" });
const garamond = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--font-garamond" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "The Music Deck",
  description: "Game reference — design system, battle rules, genres, and card decks for The Music Deck.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${garamond.variable} ${spaceMono.variable}`}>
      <body>
        <CharterTabs />
        {children}
      </body>
    </html>
  );
}
