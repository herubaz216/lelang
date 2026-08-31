"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BidFeedEntry } from "@/lib/database.types";
import { formatRupiah, formatDateTime } from "@/lib/format";
import { subscribeItemBidUpdates } from "@/lib/bid-events";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BidFeed({ itemId }: { itemId: string }) {
  const [bids, setBids] = useState<BidFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const loadBids = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_public_bid_feed", {
      p_item_id: itemId,
    });
    if (!error && data) setBids(data);
    setLoading(false);
  }, [itemId, supabase]);

  useEffect(() => {
    loadBids();

    const unsubscribe = subscribeItemBidUpdates(itemId, () => {
      loadBids();
    });

    const channel = supabase
      .channel(`bids-${itemId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bids",
          filter: `item_id=eq.${itemId}`,
        },
        () => loadBids()
      )
      .subscribe();

    return () => {
      unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [itemId, loadBids, supabase]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Penawaran</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : bids.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Belum ada penawaran.</p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {bids.map((bid, i) => (
              <div
                key={`${bid.bidder_alias}-${bid.bid_time}-${bid.amount}-${i}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{bid.bidder_alias}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(bid.bid_time)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{formatRupiah(bid.amount)}</p>
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
