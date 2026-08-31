import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
import { BidForm } from "@/components/bid-form";
import { BidFeed } from "@/components/bid-feed";
import { LivePrice } from "@/components/live-price";
import { CountdownTimer } from "@/components/countdown-timer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah, getPhotoUrl } from "@/lib/format";
import { ArrowLeft } from "lucide-react";

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

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link href="/lots">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-800">
              {photos && photos.length > 0 ? (
                <Image
                  src={getPhotoUrl(photos[0].storage_path)}
                  alt={item.item_name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl">
                  📦
                </div>
              )}
            </div>
            {photos && photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.slice(1).map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square overflow-hidden rounded-lg bg-slate-800"
                  >
                    <Image
                      src={getPhotoUrl(photo.storage_path)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="font-mono text-sm text-amber-400">
                  {item.lot_number}
                </span>
                <Badge status={item.status} />
                {item.category && (
                  <span className="text-sm text-slate-400">{item.category}</span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white">{item.item_name}</h1>
              {period && (
                <p className="mt-1 text-sm text-slate-400">{period.title}</p>
              )}
            </div>

            <div className="glass rounded-2xl p-6">
              <p className="text-sm text-slate-400">Harga saat ini</p>
              <LivePrice itemId={item.id} initialPrice={item.current_price} />
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Harga awal</p>
                  <p className="text-white">{formatRupiah(item.starting_price)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Kelipatan bid</p>
                  <p className="text-white">{formatRupiah(item.bid_increment)}</p>
                </div>
              </div>
              {period && period.status === "active" && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="text-sm text-slate-400">Berakhir dalam</p>
                  <CountdownTimer endAt={period.end_at} />
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm text-slate-300">
              <p>{item.description}</p>
              {item.item_condition && (
                <p>
                  <span className="text-slate-400">Kondisi: </span>
                  {item.item_condition}
                </p>
              )}
            </div>

            <BidForm item={item} />
            <BidFeed itemId={item.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
