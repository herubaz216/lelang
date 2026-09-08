"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LotCard } from "@/components/lot-card";
import { Input } from "@/components/ui/input";
import { AuctionItem, ItemPhoto } from "@/lib/database.types";
import {
  getWindowScrollY,
  loadScrollPosition,
  restoreCatalogScroll,
  saveScrollPosition,
} from "@/lib/catalog-view-state";
import { Package, Search, X } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter(({ item }) =>
      item.item_name.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama barang..."
            className="h-11 pl-9 pr-9"
            aria-label="Cari nama barang"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Hapus pencarian"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500">
          {searchQuery.trim()
            ? `${filteredItems.length} dari ${items.length} lot`
            : `${items.length} lot`}
        </p>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Package className="h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-700">
            Tidak ada barang ditemukan
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Tidak ada lot dengan nama “{searchQuery.trim()}”.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-4 text-sm font-medium text-[var(--primary)] hover:underline"
          >
            Hapus pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
          {filteredItems.map(({ item, photos, bidCount }) => (
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
      )}
    </div>
  );
}
