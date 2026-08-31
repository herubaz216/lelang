import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BidForm } from "@/components/bid-form";
import { BidFeed } from "@/components/bid-feed";
import { LivePrice } from "@/components/live-price";
import { PhotoCarousel } from "@/components/photo-carousel";
import { CountdownTimer } from "@/components/countdown-timer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { isPeriodBiddingOpen, isPeriodClosed } from "@/lib/auction";
import { ArrowLeft, Lock } from "lucide-react";

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("auction_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!item) notFound();

  const { data: photos } = await supabase
    .from("item_photos")
    .select("*")
    .eq("item_id", id)
    .order("sort_order");

  const { data: period } = await supabase
    .from("auction_periods")
    .select("*")
    .eq("id", item.period_id)
    .maybeSingle();

  const biddingOpen = isPeriodBiddingOpen(period);
  const periodClosed = isPeriodClosed(period);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-[var(--border)] bg-white">
          <div className="container-app py-4">
            <Link href="/lots">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
            </Link>
          </div>
        </div>

        {periodClosed && (
          <div className="border-b border-slate-200 bg-slate-800 text-white">
            <div className="container-app flex items-center gap-3 py-3 text-sm">
              <Lock className="h-4 w-4 shrink-0" />
              <p>
                Periode lelang <strong>{period?.code}</strong> telah selesai — penawaran
                ditutup.
              </p>
            </div>
          </div>
        )}

        <div className="container-app py-6 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-6">
              <PhotoCarousel photos={photos ?? []} alt={item.item_name} />
              <BidFeed itemId={item.id} />
            </div>

            <div className="space-y-5">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    {item.lot_number}
                  </span>
                  <Badge status={item.status} />
                  {periodClosed && (
                    <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-white">
                      Closed
                    </span>
                  )}
                  {item.category && (
                    <span className="text-sm text-slate-500">{item.category}</span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {item.item_name}
                </h1>
                {period && (
                  <p className="mt-2 text-sm text-slate-500">{period.title}</p>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
                <p className="text-sm text-slate-500">Harga saat ini</p>
                <LivePrice itemId={item.id} initialPrice={item.current_price} />
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-5">
                  <div>
                    <p className="text-xs text-slate-500">Harga awal</p>
                    <p className="font-medium text-slate-900">
                      {formatRupiah(item.starting_price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Kelipatan bid</p>
                    <p className="font-medium text-slate-900">
                      {formatRupiah(item.bid_increment)}
                    </p>
                  </div>
                </div>
                {biddingOpen && period && (
                  <div className="mt-5 border-t border-[var(--border)] pt-5">
                    <p className="mb-2 text-xs text-slate-500">Berakhir dalam</p>
                    <CountdownTimer endAt={period.end_at} />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 sm:p-5">
                <p>{item.description}</p>
                {item.item_condition && (
                  <p className="mt-3 border-t border-[var(--border)] pt-3">
                    <span className="font-medium text-slate-700">Kondisi: </span>
                    {item.item_condition}
                  </p>
                )}
              </div>

              <BidForm item={item} period={period} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
