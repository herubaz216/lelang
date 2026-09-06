"use client";

import { useEffect, useRef } from "react";
import { LotCard } from "@/components/lot-card";
import { AuctionItem, ItemPhoto } from "@/lib/database.types";
import {
  loadScrollPosition,
  restoreCatalogScroll,
  saveScrollPosition,
} from "@/lib/catalog-view-state";

type LotListItem = {
  item: AuctionItem;
  photos: ItemPhoto[];
  bidCount: number;
};

export function LotsGrid({
  companyId,
  items,
}: {
  companyId: string;
  items: LotListItem[];
}) {
  const scrollKey = `lots:${companyId}`;
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const saved = loadScrollPosition(scrollKey);
    let rawAnchor: string | null = null;
    try {
      rawAnchor = sessionStorage.getItem(`${scrollKey}:anchor`);
    } catch {
      rawAnchor = null;
    }

    const cancelRestore =
      saved != null || rawAnchor
        ? restoreCatalogScroll(saved ?? 0, {
            anchorId: rawAnchor ? `lot-${rawAnchor}` : null,
          })
        : () => {};

    let ticking = false;
    const onScroll = () => {
      if (window.scrollY > 0) lastScrollY.current = window.scrollY;
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        saveScrollPosition(scrollKey, lastScrollY.current);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelRestore();
      window.removeEventListener("scroll", onScroll);
    };
  }, [scrollKey]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
      {items.map(({ item, photos, bidCount }) => (
        <div key={item.id} id={`lot-${item.id}`} className="scroll-mt-24">
          <LotCard
            item={item}
            photos={photos}
            bidCount={bidCount}
            onNavigate={(itemId) => {
              if (window.scrollY > 0) lastScrollY.current = window.scrollY;
              saveScrollPosition(scrollKey, lastScrollY.current);
              try {
                sessionStorage.setItem(`${scrollKey}:anchor`, itemId);
              } catch {
                // ignore
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}
