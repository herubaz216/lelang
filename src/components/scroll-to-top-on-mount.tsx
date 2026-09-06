"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setWindowScrollY } from "@/lib/catalog-view-state";

/** Pastikan halaman detail lot selalu mulai dari atas. */
export function ScrollToTopOnMount() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setWindowScrollY(0);
    const t1 = window.setTimeout(() => setWindowScrollY(0), 50);
    const t2 = window.setTimeout(() => setWindowScrollY(0), 200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  return null;
}
