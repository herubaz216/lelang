"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuctionItem } from "@/lib/database.types";
import { formatRupiah } from "@/lib/format";

export function LivePrice({ itemId, initialPrice }: { itemId: string; initialPrice: number }) {
  const [price, setPrice] = useState(initialPrice);
  const [pulse, setPulse] = useState(false);
  const supabase = createClient();

  useEffect(() => {
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
          if (updated.current_price !== price) {
            setPrice(updated.current_price);
            setPulse(true);
            setTimeout(() => setPulse(false), 1000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemId, price]);

  return (
    <p
      className={`text-3xl font-bold text-amber-400 transition-all ${pulse ? "scale-105" : ""}`}
    >
      {formatRupiah(price)}
    </p>
  );
}
