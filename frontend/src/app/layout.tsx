import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import Link from "next/link";
import "./globals.css";

// Fonte projetada para legibilidade por pessoas com baixa visão.
const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Trilha",
  description:
    "IA para alinhar currículos e trajetórias às profissões do futuro — SMD/UFC",
};

const perfis = [
  { href: "/coordenacao", rotulo: "Coordenação" },
  { href: "/discente", rotulo: "Discente" },
  { href: "/sobre-ia", rotulo: "Sobre a IA" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${atkinson.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 bg-accent text-accent-foreground px-4 py-2 rounded"
        >
          Pular para o conteúdo
        </a>
        <header className="border-b border-border">
          <div className="mx-auto max-w-5xl px-4 py-4 flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="text-2xl font-bold">
              Trilha
            </Link>
            {/* Seletor de perfil — sem autenticação (ADR 0008) */}
            <nav aria-label="Perfil">
              <ul className="flex flex-wrap gap-2">
                {perfis.map((p) => (
                  <li key={p.href}>
                    <Link
                      href={p.href}
                      className="inline-block rounded border border-border px-3 py-2 hover:bg-surface"
                    >
                      {p.rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>
        <main id="conteudo" className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-border">
          <p className="mx-auto max-w-5xl px-4 py-4 text-sm text-muted">
            Ferramenta de apoio à decisão. Não substitui o NDE, o GPT nem a
            coordenação do curso.
          </p>
        </footer>
      </body>
    </html>
  );
}
