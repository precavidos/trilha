"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Rolagem vertical suavizada na página toda. A Lenis respeita `prefers-reduced-motion` por padrão
 * (`respectReducedMotion`), inclusive quando a preferência muda com a página aberta.
 */
export function RolagemSuave() {
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true, anchors: true });
    return () => lenis.destroy();
  }, []);
  return null;
}
