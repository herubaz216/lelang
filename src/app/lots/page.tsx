import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { LotCard } from "@/components/lot-card";
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
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-[var(--border)] bg-white">
          <div className="container-app py-10">
            <h1 className="text-3xl font-bold text-slate-900">Semua Lot</h1>
            <p className="mt-2 text-slate-500">
              {itemsWithPhotos.length} barang tersedia untuk dilelang
            </p>
          </div>
        </div>
        <div className="container-app py-10">
          {itemsWithPhotos.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-slate-500">Belum ada lot tersedia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
              {itemsWithPhotos.map(({ item, photos: itemPhotos }) => (
                <LotCard key={item.id} item={item} photos={itemPhotos} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
