import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
import { AuctionCard } from "@/components/auction-card";
import { CountdownTimer } from "@/components/countdown-timer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuctionItem, ItemPhoto } from "@/lib/database.types";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: period } = await supabase
    .from("auction_periods")
    .select("*")
    .eq("status", "active")
    .order("start_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let items: { item: AuctionItem; photos: ItemPhoto[] }[] = [];

  if (period) {
    const { data: auctionItems } = await supabase
      .from("auction_items")
      .select("*")
      .eq("period_id", period.id)
      .in("status", ["active", "ready"])
      .order("lot_number")
      .limit(6);

    if (auctionItems) {
      const itemIds = auctionItems.map((i) => i.id);
      const { data: photos } = await supabase
        .from("item_photos")
        .select("*")
        .in("item_id", itemIds)
        .order("sort_order");

      items = auctionItems.map((item) => ({
        item,
        photos: (photos ?? []).filter((p) => p.item_id === item.id),
      }));
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="relative overflow-hidden px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl text-center">
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-amber-400">
              Platform Lelang Internal
            </p>
            <h1
              className="mb-6 text-4xl font-bold text-white sm:text-6xl"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Lelang Aset
              <span className="block bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                Operasional
              </span>
            </h1>
            {period ? (
              <div className="mx-auto max-w-2xl space-y-4">
                <Badge status={period.status} className="text-sm" />
                <h2 className="text-xl text-slate-300">{period.title}</h2>
                <CountdownTimer endAt={period.end_at} className="justify-center" />
                <p className="text-sm text-slate-400">{period.description}</p>
                <Link href="/lots">
                  <Button variant="gold" size="lg" className="mt-4">
                    Lihat Semua Lot
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-slate-400">
                Tidak ada periode lelang aktif saat ini.
              </p>
            )}
          </div>
        </section>

        {items.length > 0 && (
          <section className="px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-7xl">
              <h2 className="mb-8 text-2xl font-bold text-white">
                Lot Terbaru
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(({ item, photos }) => (
                  <div key={item.id} className="animate-fade-in">
                    <AuctionCard item={item} photos={photos} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
