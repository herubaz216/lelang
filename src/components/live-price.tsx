"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuctionItem } from "@/lib/database.types";
import { formatRupiah } from "@/lib/format";
import { subscribeItemBidUpdates } from "@/lib/bid-events";
import { cn } from "@/lib/utils";

export function LivePrice({
  itemId,
  initialPrice,
}: {
  itemId: string;
  initialPrice: number;
}) {
  const [price, setPrice] = useState(initialPrice);
  const [pulse, setPulse] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const loadPrice = useCallback(async () => {
    const { data } = await supabase
      .from("auction_items")
      .select("current_price")
      .eq("id", itemId)
      .maybeSingle();

    if (!data) return;

    setPrice((prev) => {
      if (prev !== data.current_price) {
        setPulse(true);
        setTimeout(() => setPulse(false), 800);
      }
      return data.current_price;
    });
  }, [itemId, supabase]);

  useEffect(() => {
    setPrice(initialPrice);
  }, [initialPrice]);

  useEffect(() => {
    const unsubscribe = subscribeItemBidUpdates(itemId, loadPrice);

    const channel = supabase
      .channel(`price-${itemId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "auction_items",
          filter: `id=eq.${itemId}`,
        },
        (payload) => {
          const updated = payload.new as AuctionItem;
          setPrice((prev) => {
            if (prev !== updated.current_price) {
              setPulse(true);
              setTimeout(() => setPulse(false), 800);
            }
            return updated.current_price;
          });
        }
      )
      .subscribe();

    return () => {
      unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [itemId, loadPrice, supabase]);

  return (
    <p
      className={cn(
        "text-3xl font-bold text-slate-900 transition-all",
        pulse && "scale-[1.02] text-[var(--primary)]"
      )}
    >
      {formatRupiah(price)}
    </p>
  );
}
