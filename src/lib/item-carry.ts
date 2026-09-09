import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuctionItem, Database } from "@/lib/database.types";
import { getPhotoUrl } from "@/lib/format";

type AppSupabase = SupabaseClient<Database>;

export type CarryUnbidResult = {
  sourcePeriodId: string;
  sourcePeriodCode: string;
  carried: number;
  failed: number;
};

/** Cari periode sumber: finished terbaru di perusahaan yang sama. */
export async function findCarrySourcePeriod(
  supabase: AppSupabase,
  companyId: string
): Promise<{ id: string; code: string } | null> {
  const { data } = await supabase
    .from("auction_periods")
    .select("id, code")
    .eq("company_id", companyId)
    .eq("status", "finished")
    .order("end_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function fetchUnbidItemsForPeriod(
  supabase: AppSupabase,
  periodId: string
): Promise<AuctionItem[]> {
  const { data: items } = await supabase
    .from("auction_items")
    .select("*")
    .eq("period_id", periodId)
    .in("status", ["active", "ready", "draft", "unsold"])
    .order("lot_number");

  const list = items ?? [];
  if (list.length === 0) return [];

  const { data: counts } = await supabase.rpc("get_item_bid_counts", {
    p_item_ids: list.map((item) => item.id),
  });

  const bidCountByItem = new Map<string, number>();
  for (const row of counts ?? []) {
    bidCountByItem.set(row.item_id, Number(row.bid_count ?? 0));
  }

  return list.filter((item) => (bidCountByItem.get(item.id) ?? 0) === 0);
}

async function copyItemPhotos(
  supabase: AppSupabase,
  sourceItemId: string,
  targetItemId: string
) {
  const { data: sourcePhotos } = await supabase
    .from("item_photos")
    .select("*")
    .eq("item_id", sourceItemId)
    .order("sort_order");

  for (const photo of sourcePhotos ?? []) {
    try {
      const response = await fetch(getPhotoUrl(photo.storage_path));
      if (!response.ok) continue;
      const blob = await response.blob();
      const path = `${targetItemId}/${Date.now()}-${photo.sort_order}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("auction-photos")
        .upload(path, blob, { contentType: blob.type || "image/jpeg" });
      if (uploadError) continue;

      await supabase.from("item_photos").insert({
        item_id: targetItemId,
        storage_path: path,
        sort_order: photo.sort_order,
      });
    } catch {
      // Skip individual photo failures.
    }
  }
}

/** Duplikasi barang belum di-bid dari periode finished ke periode baru. */
export async function carryUnbidItemsToPeriod(
  supabase: AppSupabase,
  {
    companyId,
    targetPeriodId,
    sourcePeriodId,
  }: {
    companyId: string;
    targetPeriodId: string;
    sourcePeriodId?: string | null;
  }
): Promise<CarryUnbidResult | null> {
  const source =
    sourcePeriodId != null
      ? await supabase
          .from("auction_periods")
          .select("id, code")
          .eq("id", sourcePeriodId)
          .eq("company_id", companyId)
          .maybeSingle()
          .then((res) => res.data)
      : await findCarrySourcePeriod(supabase, companyId);

  if (!source) return null;

  const unbidItems = await fetchUnbidItemsForPeriod(supabase, source.id);
  if (unbidItems.length === 0) {
    return {
      sourcePeriodId: source.id,
      sourcePeriodCode: source.code,
      carried: 0,
      failed: 0,
    };
  }

  let carried = 0;
  let failed = 0;

  for (const item of unbidItems) {
    const { data: created, error } = await supabase.rpc(
      "admin_create_auction_item",
      {
        p_period_id: targetPeriodId,
        p_item_name: item.item_name,
        p_category: item.category,
        p_description: item.description,
        p_item_condition: item.item_condition,
        p_status: "draft",
        p_starting_price: item.starting_price,
        p_bid_increment: item.bid_increment,
      }
    );

    if (error || !created) {
      failed += 1;
      continue;
    }

    await copyItemPhotos(supabase, item.id, created.id);
    carried += 1;
  }

  return {
    sourcePeriodId: source.id,
    sourcePeriodCode: source.code,
    carried,
    failed,
  };
}
