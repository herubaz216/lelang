import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type AppSupabase = SupabaseClient<Database>;

export type CompanyAssetTotals = {
  itemCount: number;
  startingTotal: number;
  /** Sum of highest bid per item (items without bids = 0). */
  biddingTotal: number;
  /** Sum of starting_price for items that already have bids. */
  biddingBaseTotal: number;
  itemsWithBids: number;
};

export async function fetchCompanyAssetTotals(
  supabase: AppSupabase,
  companyId: string
): Promise<CompanyAssetTotals> {
  const { data: periods } = await supabase
    .from("auction_periods")
    .select("id")
    .eq("company_id", companyId);

  const periodIds = (periods ?? []).map((period) => period.id);
  if (periodIds.length === 0) {
    return {
      itemCount: 0,
      startingTotal: 0,
      biddingTotal: 0,
      biddingBaseTotal: 0,
      itemsWithBids: 0,
    };
  }

  const { data: items } = await supabase
    .from("auction_items")
    .select("id, starting_price")
    .in("period_id", periodIds);

  const itemList = items ?? [];
  const itemIds = itemList.map((item) => item.id);

  let startingTotal = 0;
  for (const item of itemList) {
    startingTotal += Number(item.starting_price) || 0;
  }

  if (itemIds.length === 0) {
    return {
      itemCount: 0,
      startingTotal: 0,
      biddingTotal: 0,
      biddingBaseTotal: 0,
      itemsWithBids: 0,
    };
  }

  const { data: bids } = await supabase
    .from("bids")
    .select("item_id, amount")
    .in("item_id", itemIds)
    .neq("status", "cancelled");

  // Harga tertinggi per barang saja (bukan jumlah semua bid).
  const maxBidByItem = new Map<string, number>();
  for (const bid of bids ?? []) {
    const amount = Number(bid.amount) || 0;
    const prev = maxBidByItem.get(bid.item_id) ?? 0;
    if (amount > prev) {
      maxBidByItem.set(bid.item_id, amount);
    }
  }

  let biddingTotal = 0;
  let biddingBaseTotal = 0;
  for (const item of itemList) {
    const maxBid = maxBidByItem.get(item.id);
    if (maxBid == null) continue;
    biddingTotal += maxBid;
    biddingBaseTotal += Number(item.starting_price) || 0;
  }

  return {
    itemCount: itemList.length,
    startingTotal,
    biddingTotal,
    biddingBaseTotal,
    itemsWithBids: maxBidByItem.size,
  };
}
