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
    "Super app anticorrupção open source e comunitário: ficha do político, manual do candidato 2026, radar de contratos públicos com red flags, empresas sancionadas e catálogo de todas as APIs públicas do Brasil.",
  metadataBase: new URL("https://monitor-de-gravata.vercel.app"),
  openGraph: {
    title: "Monitor de Gravata — o Pesadelo de Brasília",
    description:
      "Dados públicos, regras abertas e comunidade auditando o poder. Ficha do político, manual do candidato, radar de contratos e red flags.",
    locale: "pt_BR",
    type: "website",
  },
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
