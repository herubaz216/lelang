"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Pastikan halaman detail lot selalu mulai dari atas. */
export function ScrollToTopOnMount() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      html.style.scrollBehavior = previous;
    });
  }, [pathname]);

  return null;
}
