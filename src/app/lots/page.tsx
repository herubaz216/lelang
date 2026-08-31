import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
import { AuctionCard } from "@/components/auction-card";
import { AuctionItem, ItemPhoto } from "@/lib/database.types";

export default async function LotsPage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("auction_items")
    .select("*")
    .in("status", ["active", "ready", "sold"])
    .order("lot_number");

  const itemIds = (items ?? []).map((i) => i.id);
  const { data: photos } = itemIds.length
    ? await supabase
        .from("item_photos")
        .select("*")
        .in("item_id", itemIds)
        .order("sort_order")
    : { data: [] as ItemPhoto[] };

  const itemsWithPhotos = (items ?? []).map((item: AuctionItem) => ({
    item,
    photos: (photos ?? []).filter((p) => p.item_id === item.id),
  }));

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="mb-2 text-3xl font-bold text-white">Semua Lot</h1>
        <p className="mb-8 text-slate-400">
          {itemsWithPhotos.length} barang tersedia
        </p>
        {itemsWithPhotos.length === 0 ? (
          <p className="text-center text-slate-400">Belum ada lot tersedia.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {itemsWithPhotos.map(({ item, photos: itemPhotos }) => (
              <AuctionCard key={item.id} item={item} photos={itemPhotos} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
