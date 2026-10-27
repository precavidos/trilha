import type { ReactNode } from "react";

const ICONES: Record<string, ReactNode> = {
  "ux-ui": (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M3 9h18M9 9v11" />
    </>
  ),
  jogos: (
    <>
      <rect x="2" y="7" width="20" height="11" rx="5" />
      <path d="M7 11v3M5.5 12.5h3M15 12h.01M18 13h.01" />
    </>
  ),
  web: <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />,
  animacao: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="7.5" r="1.5" />
      <circle cx="12" cy="16.5" r="1.5" />
      <circle cx="7.5" cy="12" r="1.5" />
      <circle cx="16.5" cy="12" r="1.5" />
    </>
  ),
  multimidia: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  audiovisual: (
    <>
      <rect x="2" y="6" width="14" height="12" rx="3" />
      <path d="m16 10 6-3v10l-6-3" />
    </>
  ),
  "lente-ia": <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" />,
};

/** Ícone da profissão-alvo; um id desconhecido não renderiza nada. */
export function IconeProfissao({ id }: { id: string }) {
  const desenho = ICONES[id];
  if (!desenho) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-5"
    >
      {desenho}
    </svg>
  );
}
