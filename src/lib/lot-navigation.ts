import { createClient } from "@/lib/supabase/server";

export type NextLotItem = {
  id: string;
  lot_number: string;
  item_name: string;
};

export async function fetchNextLotItem({
  periodId,
  currentLotNumber,
  category,
}: {
  periodId: string;
  currentLotNumber: string;
  category?: string | null;
}): Promise<NextLotItem | null> {
  const supabase = await createClient();

  let query = supabase
    .from("auction_items")
    .select("id, lot_number, item_name")
    .eq("period_id", periodId)
    .in("status", ["active", "ready", "sold"])
    .gt("lot_number", currentLotNumber)
    .order("lot_number")
    .limit(1);

  if (category && category !== "all") {
    if (category === "Lainnya") {
      query = query.or("category.eq.Lainnya,category.is.null");
    } else {
      query = query.eq("category", category);
    }
  }

  const { data } = await query;
  return data?.[0] ?? null;
}

export function lotDetailHref(itemId: string, category?: string | null) {
  if (!category || category === "all") return `/lots/${itemId}`;
  return `/lots/${itemId}?category=${encodeURIComponent(category)}`;
}
