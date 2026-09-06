"use client";

import { useEffect } from "react";
import { LotCard } from "@/components/lot-card";
import { AuctionItem, ItemPhoto } from "@/lib/database.types";
import {
  loadScrollPosition,
  restoreWindowScroll,
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const saved = loadScrollPosition(scrollKey);
    if (saved != null) {
      restoreWindowScroll(saved);
    }

    let ticking = false;
    const persist = () => saveScrollPosition(scrollKey, window.scrollY);
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        persist();
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", persist);
    return () => {
      persist();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", persist);
    };
  }, [scrollKey]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
      {items.map(({ item, photos, bidCount }) => (
        <LotCard
          key={item.id}
          item={item}
          photos={photos}
          bidCount={bidCount}
        />
      ))}
    </div>
  );
}
