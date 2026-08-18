import type { Metadata } from "next";
import { Anton, Archivo, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
});
const instrument = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  title: {
    default: "Monitor de Gravata — o Pesadelo de Brasília",
    template: "%s · Monitor de Gravata",
  },
  description:
    "Portal da transparência feito pela sociedade: ficha de deputados, senadores e candidatos 2026, radar de contratos públicos com sinais de risco, comparador de preços e catálogo das fontes oficiais do Brasil. Open source, sem partido.",
  metadataBase: new URL("https://monitor-de-gravata.vercel.app"),
  applicationName: "Monitor de Gravata",
  openGraph: {
    title: "Monitor de Gravata — o pesadelo de Brasília",
    description: "O dinheiro é seu. As contas são públicas. O que falta é gente olhando. Ficha de quem te representa, radar de contratos e comparador de preços — só com fonte oficial.",
    locale: "pt_BR",
    type: "website",
    siteName: "Monitor de Gravata",
  },
  twitter: {
    card: "summary_large_image",
    title: "Monitor de Gravata — o pesadelo de Brasília",
    description: "O dinheiro é seu. As contas são públicas. O que falta é gente olhando.",
  },
  icons: { icon: "/icon.svg", apple: "/apple-icon" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${anton.variable} ${archivo.variable} ${plexMono.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
