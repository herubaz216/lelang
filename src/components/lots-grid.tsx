"use client";

import { useEffect, useRef } from "react";
import { LotCard } from "@/components/lot-card";
import { AuctionItem, ItemPhoto } from "@/lib/database.types";
import {
  getWindowScrollY,
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
      const y = getWindowScrollY();
      if (y > 0) lastScrollY.current = y;
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        saveScrollPosition(scrollKey, lastScrollY.current);
        ticking = false;
      });
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted && saved == null && !rawAnchor) return;
      const latest = loadScrollPosition(scrollKey) ?? saved ?? 0;
      let anchor: string | null = rawAnchor;
      try {
        anchor = sessionStorage.getItem(`${scrollKey}:anchor`);
      } catch {
        // keep
      }
      restoreCatalogScroll(latest, {
        anchorId: anchor ? `lot-${anchor}` : null,
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pageshow", onPageShow);
    return () => {
      cancelRestore();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pageshow", onPageShow);
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
              const y = getWindowScrollY();
              if (y > 0) lastScrollY.current = y;
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
