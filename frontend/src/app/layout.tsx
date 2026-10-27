import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Figtree } from "next/font/google";
import { Aviso } from "@/components/ui/Aviso";
import { BarraTopo } from "@/components/ui/BarraTopo";
import "./globals.css";

// Fonte projetada para legibilidade por pessoas com baixa visão.
const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Fonte dos títulos e números de destaque.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["600", "800"],
});

export const metadata: Metadata = {
  title: "Trilha",
  description:
    "IA para alinhar currículos e trajetórias às profissões do futuro — SMD/UFC",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${atkinson.variable} ${figtree.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas text-ink font-sans">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-full focus:bg-lime focus:px-6 focus:py-3 focus:font-bold focus:text-on-lime"
        >
          Pular para o conteúdo
        </a>
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 pt-6 pb-12 md:px-8">
          <BarraTopo />
          <main id="conteudo" className="min-w-0">
            {children}
          </main>
          <footer>
            <Aviso tom="info">
              Ferramenta de apoio à decisão. Não substitui o NDE, o GPT nem a coordenação do curso.
            </Aviso>
          </footer>
        </div>
      </body>
    </html>
  );
}
