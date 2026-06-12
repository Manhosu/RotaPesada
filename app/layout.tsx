import type { Metadata, Viewport } from "next";
import { Barlow, Atkinson_Hyperlegible, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Barlow — display / UI / numerals (signage-flavored grotesque).
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
});

// Atkinson Hyperlegible — reading face engineered for low-vision legibility.
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

// JetBrains Mono — technical strings (plates, coordinates, codes).
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rota Pesada — GPS para caminhões pesados",
  description:
    "GPS e roteirização para caminhões pesados e carretas. Evite pontes baixas, viadutos, trincheiras e restrições de peso.",
};

export const viewport: Viewport = {
  themeColor: "#0A0F1A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${barlow.variable} ${atkinson.variable} ${jetbrains.variable}`}>
      <body>
        {/* Aplica a escala de fonte salva antes da pintura (evita flash). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var v=localStorage.getItem('rp-font-scale');if(v){var n=parseFloat(v);if(n>0)document.documentElement.style.setProperty('--font-scale',String(n));}}catch(e){}})();",
          }}
        />
        {children}
      </body>
    </html>
  );
}
