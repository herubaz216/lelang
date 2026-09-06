import { createClient } from "@/lib/supabase/server";
import { AuctionItem, ItemPhoto } from "@/lib/database.types";

export const PAGE_SIZE = 12;

export type ItemWithPhotos = {
  item: AuctionItem;
  photos: ItemPhoto[];
  bidCount: number;
};

async function fetchBidCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  itemIds: string[]
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  if (itemIds.length === 0) return counts;

  const { data } = await supabase.rpc("get_item_bid_counts", {
    p_item_ids: itemIds,
  });

  for (const row of data ?? []) {
    counts[row.item_id] = Number(row.bid_count ?? 0);
  }
  return counts;
}

export async function fetchItemsPage({
  periodId,
  category,
  offset,
  limit = PAGE_SIZE,
}: {
  periodId?: string;
  category?: string | null;
  offset: number;
  limit?: number;
}): Promise<{
  items: ItemWithPhotos[];
  hasMore: boolean;
  total: number;
}> {
  const supabase = await createClient();

  if (!periodId) {
    return { items: [], hasMore: false, total: 0 };
  }

  let query = supabase
    .from("auction_items")
    .select("*", { count: "exact" })
    .eq("period_id", periodId)
    .in("status", ["active", "ready", "sold"])
    .order("lot_number");

  if (category && category !== "all") {
    // "Lainnya" bisa literal di DB, atau placeholder untuk null/kosong di hitungan kategori.
    if (category === "Lainnya") {
      query = query.or("category.eq.Lainnya,category.is.null");
    } else {
      query = query.eq("category", category);
    }
  }

  const { data: auctionItems, count } = await query.range(
    offset,
    offset + limit - 1
  );

  const items = auctionItems ?? [];
  const itemIds = items.map((i) => i.id);

  let photos: ItemPhoto[] = [];
  let bidCounts: Record<string, number> = {};
  if (itemIds.length > 0) {
    const [{ data: photoData }, counts] = await Promise.all([
      supabase
        .from("item_photos")
        .select("*")
        .in("item_id", itemIds)
        .order("sort_order"),
      fetchBidCounts(supabase, itemIds),
    ]);
    photos = photoData ?? [];
    bidCounts = counts;
  }

  const itemsWithPhotos = items.map((item) => ({
    item,
    photos: photos.filter((p) => p.item_id === item.id),
    bidCount: bidCounts[item.id] ?? 0,
  }));

  const total = count ?? 0;

  return {
    items: itemsWithPhotos,
    hasMore: offset + limit < total,
    total,
  };
}

export async function fetchCategories(
  periodId?: string
): Promise<{ name: string; count: number }[]> {
  if (!periodId) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from("auction_items")
    .select("category")
    .eq("period_id", periodId)
    .in("status", ["active", "ready", "sold"]);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const cat = row.category || "Lainnya";
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
