"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BidFeedEntry } from "@/lib/database.types";
import { formatRupiah, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BidFeed({ itemId }: { itemId: string }) {
  const [bids, setBids] = useState<BidFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function loadBids() {
    const { data, error } = await supabase.rpc("get_public_bid_feed", {
      p_item_id: itemId,
    });
    if (!error && data) setBids(data);
    setLoading(false);
  }

  useEffect(() => {
    loadBids();

    const channel = supabase
      .channel(`bids-${itemId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bids", filter: `item_id=eq.${itemId}` },
        () => loadBids()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "auction_items", filter: `id=eq.${itemId}` },
        () => loadBids()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Penawaran</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        ) : bids.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada penawaran.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {bids.map((bid, i) => (
              <div
                key={`${bid.bidder_alias}-${bid.bid_time}-${i}`}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{bid.bidder_alias}</p>
                  <p className="text-xs text-slate-400">
                    {formatDateTime(bid.bid_time)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-400">
                    {formatRupiah(bid.amount)}
                  </p>
                  <Badge status={bid.bid_status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
