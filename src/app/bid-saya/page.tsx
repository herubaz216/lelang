"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, formatDateTime } from "@/lib/format";
import { Gavel, Package, ArrowRight } from "lucide-react";

type MyBid = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  item_id: string;
};

type ItemInfo = {
  id: string;
  lot_number: string;
  item_name: string;
  starting_price: number;
  current_price: number;
};

type GroupedItemBids = {
  itemId: string;
  highestBid: MyBid;
  bidCount: number;
  lastBidAt: string;
  allBids: MyBid[];
};

function groupBidsByItem(bids: MyBid[]): GroupedItemBids[] {
  const map = new Map<string, MyBid[]>();

  for (const bid of bids) {
    const list = map.get(bid.item_id) ?? [];
    list.push(bid);
    map.set(bid.item_id, list);
  }

  return Array.from(map.entries())
    .map(([itemId, itemBids]) => {
      const allBids = [...itemBids].sort((a, b) => b.amount - a.amount);
      const highestBid = allBids[0];
      const lastBidAt = [...itemBids].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0].created_at;

      return {
        itemId,
        highestBid,
        bidCount: itemBids.length,
        lastBidAt,
        allBids,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastBidAt).getTime() - new Date(a.lastBidAt).getTime()
    );
}

export default function BidSayaPage() {
  const [bids, setBids] = useState<MyBid[]>([]);
  const [items, setItems] = useState<Record<string, ItemInfo>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const groupedBids = useMemo(() => groupBidsByItem(bids), [bids]);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?redirect=/bid-saya");
        return;
      }

      const { data: bidder } = await supabase
        .from("bidder_profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!bidder) {
        setLoading(false);
        return;
      }

      const { data: bidData } = await supabase
        .from("bids")
        .select("id, amount, status, created_at, item_id")
        .eq("bidder_id", bidder.id)
        .order("created_at", { ascending: false });

      const list = bidData ?? [];
      setBids(list);

      if (list.length > 0) {
        const itemIds = [...new Set(list.map((b) => b.item_id))];
        const { data: itemData } = await supabase
          .from("auction_items")
          .select("id, lot_number, item_name, starting_price, current_price")
          .in("id", itemIds);

        const map: Record<string, ItemInfo> = {};
        for (const item of itemData ?? []) {
          map[item.id] = item;
        }
        setItems(map);
      }

      setLoading(false);
    }

    load();
  }, [supabase, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-[var(--border)] bg-white">
          <div className="container-app py-8 sm:py-10">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                <Gavel className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Bid Saya</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Ringkasan penawaran Anda per barang lelang
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container-app py-8">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : groupedBids.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
              <Package className="h-12 w-12 text-slate-300" />
              <p className="mt-4 font-medium text-slate-700">Belum ada penawaran</p>
              <p className="mt-1 text-sm text-slate-500">
                Mulai bid pada barang lelang yang aktif
              </p>
              <Link
                href="/lots"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white"
              >
                Lihat Semua Lot
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
              <div className="hidden grid-cols-[1fr_110px_110px_110px_90px] gap-4 border-b border-[var(--border)] bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
                <span>Barang</span>
                <span className="text-right">Harga Awal</span>
                <span className="text-right">Bid Tertinggi</span>
                <span className="text-right">Harga Terkini</span>
                <span>Status</span>
              </div>
              <ul className="divide-y divide-[var(--border)]">
                {groupedBids.map(({ itemId, highestBid, bidCount, lastBidAt, allBids }) => {
                  const item = items[itemId];
                  const isLeading =
                    item &&
                    highestBid.amount >= item.current_price &&
                    highestBid.status === "valid";

                  return (
                    <li key={itemId}>
                      <Link
                        href={`/lots/${itemId}`}
                        className="block transition-colors hover:bg-slate-50/80"
                      >
                        <div className="hidden items-center gap-4 px-5 py-4 lg:grid lg:grid-cols-[1fr_110px_110px_110px_90px]">
                          <div className="min-w-0">
                            {item ? (
                              <>
                                <span className="font-mono text-xs font-semibold text-[var(--primary)]">
                                  {item.lot_number}
                                </span>
                                <p className="truncate font-medium text-slate-900">
                                  {item.item_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {bidCount} penawaran &bull; terakhir{" "}
                                  {formatDateTime(lastBidAt)}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-slate-500">Barang tidak tersedia</p>
                            )}
                          </div>
                          <p className="text-right text-sm text-slate-600">
                            {item ? formatRupiah(item.starting_price) : "—"}
                          </p>
                          <p className="text-right font-semibold text-slate-900">
                            {formatRupiah(highestBid.amount)}
                          </p>
                          <p className="text-right text-sm text-slate-600">
                            {item ? formatRupiah(item.current_price) : "—"}
                          </p>
                          <Badge status={isLeading ? "winner" : highestBid.status} />
                        </div>

                        <div className="p-4 lg:hidden">
                          {item ? (
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="font-mono text-xs font-semibold text-[var(--primary)]">
                                    {item.lot_number}
                                  </span>
                                  <p className="font-medium text-slate-900">{item.item_name}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {bidCount} penawaran &bull; terakhir{" "}
                                    {formatDateTime(lastBidAt)}
                                  </p>
                                </div>
                                <Badge status={isLeading ? "winner" : highestBid.status} />
                              </div>
                              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                                <div>
                                  <p className="text-xs text-slate-500">Harga Awal</p>
                                  <p className="font-medium text-slate-700">
                                    {formatRupiah(item.starting_price)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Bid Tertinggi</p>
                                  <p className="font-semibold text-slate-900">
                                    {formatRupiah(highestBid.amount)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-slate-500">Harga Terkini</p>
                                  <p className="font-medium text-slate-700">
                                    {formatRupiah(item.current_price)}
                                  </p>
                                </div>
                              </div>
                              {bidCount > 1 && (
                                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                                  <p className="text-xs font-medium text-slate-500">
                                    Riwayat bid
                                  </p>
                                  <ul className="mt-1 space-y-0.5">
                                    {allBids.map((bid) => (
                                      <li
                                        key={bid.id}
                                        className="flex justify-between text-xs text-slate-600"
                                      >
                                        <span>{formatDateTime(bid.created_at)}</span>
                                        <span>{formatRupiah(bid.amount)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-slate-500">Barang tidak tersedia</p>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
