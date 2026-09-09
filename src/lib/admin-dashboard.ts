import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuctionPeriod, Database } from "@/lib/database.types";

type AppSupabase = SupabaseClient<Database>;

export type CompanyAssetTotals = {
  itemCount: number;
  startingTotal: number;
  /** Sum of highest bid per item (items without bids = 0). */
  biddingTotal: number;
  /** Sum of starting_price for items that already have bids. */
  biddingBaseTotal: number;
  itemsWithBids: number;
  paidTotal: number;
  unpaidBiddingTotal: number;
  paidItemCount: number;
  unpaidItemCount: number;
};

export type DashboardPeriodSummary = AuctionPeriod & {
  itemCount: number;
  unbidCount: number;
};

const emptyTotals = (): CompanyAssetTotals => ({
  itemCount: 0,
  startingTotal: 0,
  biddingTotal: 0,
  biddingBaseTotal: 0,
  itemsWithBids: 0,
  paidTotal: 0,
  unpaidBiddingTotal: 0,
  paidItemCount: 0,
  unpaidItemCount: 0,
});

export async function fetchCompanyAssetTotals(
  supabase: AppSupabase,
  companyId: string,
  periodId?: string | null
): Promise<CompanyAssetTotals> {
  let periodIds: string[] = [];

  if (periodId) {
    periodIds = [periodId];
  } else {
    const { data: periods } = await supabase
      .from("auction_periods")
      .select("id")
      .eq("company_id", companyId);
    periodIds = (periods ?? []).map((period) => period.id);
  }

  if (periodIds.length === 0) return emptyTotals();

  const { data: items } = await supabase
    .from("auction_items")
    .select("id, starting_price, payment_confirmed, current_price")
    .in("period_id", periodIds);

  const itemList = items ?? [];
  const itemIds = itemList.map((item) => item.id);

  let startingTotal = 0;
  for (const item of itemList) {
    startingTotal += Number(item.starting_price) || 0;
  }

  if (itemIds.length === 0) return emptyTotals();

  const { data: bids } = await supabase
    .from("bids")
    .select("item_id, amount")
    .in("item_id", itemIds)
    .neq("status", "cancelled");

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
  let paidTotal = 0;
  let unpaidBiddingTotal = 0;
  let paidItemCount = 0;
  let unpaidItemCount = 0;

  for (const item of itemList) {
    const maxBid = maxBidByItem.get(item.id);
    const winValue =
      maxBid != null
        ? maxBid
        : Number(item.current_price) || Number(item.starting_price) || 0;

    if (maxBid != null) {
      biddingTotal += maxBid;
      biddingBaseTotal += Number(item.starting_price) || 0;
    }

    if (item.payment_confirmed) {
      paidTotal += winValue;
      paidItemCount += 1;
    } else if (maxBid != null) {
      unpaidBiddingTotal += maxBid;
      unpaidItemCount += 1;
    }
  }

  return {
    itemCount: itemList.length,
    startingTotal,
    biddingTotal,
    biddingBaseTotal,
    itemsWithBids: maxBidByItem.size,
    paidTotal,
    unpaidBiddingTotal,
    paidItemCount,
    unpaidItemCount,
  };
}

export async function fetchDashboardPeriods(
  supabase: AppSupabase,
  companyId: string
): Promise<DashboardPeriodSummary[]> {
  const { data: periods } = await supabase
    .from("auction_periods")
    .select("*")
    .eq("company_id", companyId)
    .order("start_at", { ascending: false });

  const list = periods ?? [];
  if (list.length === 0) return [];

  const periodIds = list.map((period) => period.id);
  const { data: items } = await supabase
    .from("auction_items")
    .select("id, period_id")
    .in("period_id", periodIds);

  const itemList = items ?? [];
  const itemIds = itemList.map((item) => item.id);
  const counts = new Map<string, number>();
  for (const item of itemList) {
    counts.set(item.period_id, (counts.get(item.period_id) ?? 0) + 1);
  }

  const bidCountByItem = new Map<string, number>();
  if (itemIds.length > 0) {
    const { data: bidCounts } = await supabase.rpc("get_item_bid_counts", {
      p_item_ids: itemIds,
    });
    for (const row of bidCounts ?? []) {
      bidCountByItem.set(row.item_id, Number(row.bid_count ?? 0));
    }
  }

  const unbidByPeriod = new Map<string, number>();
  for (const item of itemList) {
    if ((bidCountByItem.get(item.id) ?? 0) > 0) continue;
    unbidByPeriod.set(
      item.period_id,
      (unbidByPeriod.get(item.period_id) ?? 0) + 1
    );
  }

  const ranked = [...list].sort((a, b) => {
    const rank = (status: string) => {
      if (status === "active") return 0;
      if (status === "draft") return 1;
      if (status === "finished") return 2;
      return 3;
    };
    const diff = rank(a.status) - rank(b.status);
    if (diff !== 0) return diff;
    return new Date(b.start_at).getTime() - new Date(a.start_at).getTime();
  });

  return ranked.map((period) => ({
    ...period,
    itemCount: counts.get(period.id) ?? 0,
    unbidCount: unbidByPeriod.get(period.id) ?? 0,
  }));
}
