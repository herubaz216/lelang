import { createClient } from "@/lib/supabase/server";
import { AuctionPeriod } from "@/lib/database.types";

export type WinnerRow = {
  itemId: string;
  lotNumber: string;
  itemName: string;
  startingPrice: number;
  lastPrice: number;
  bidderAlias: string | null;
  photoPath: string | null;
  periodCode: string;
  periodTitle: string;
};

export async function fetchFinishedPeriods(): Promise<AuctionPeriod[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("auction_periods")
    .select("*")
    .in("status", ["finished", "cancelled"])
    .order("end_at", { ascending: false });
  return data ?? [];
}

export async function fetchWinners(periodId?: string): Promise<{
  period: AuctionPeriod | null;
  rows: WinnerRow[];
}> {
  const supabase = await createClient();

  let period: AuctionPeriod | null = null;

  if (periodId) {
    const { data } = await supabase
      .from("auction_periods")
      .select("*")
      .eq("id", periodId)
      .maybeSingle();
    period = data;
  } else {
    const { data } = await supabase
      .from("auction_periods")
      .select("*")
      .eq("status", "finished")
      .order("end_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    period = data;
  }

  if (!period) {
    return { period: null, rows: [] };
  }

  const { data: items } = await supabase
    .from("auction_items")
    .select("id, lot_number, item_name, starting_price, current_price")
    .eq("period_id", period.id)
    .order("lot_number");

  if (!items?.length) {
    return { period, rows: [] };
  }

  const itemIds = items.map((i) => i.id);

  const [{ data: photos }, { data: bids }] = await Promise.all([
    supabase
      .from("item_photos")
      .select("item_id, storage_path, sort_order")
      .in("item_id", itemIds)
      .order("sort_order"),
    supabase
      .from("bids")
      .select("item_id, amount, status, bidder_id")
      .in("item_id", itemIds)
      .order("amount", { ascending: false }),
  ]);

  const photoByItem = new Map<string, string>();
  for (const p of photos ?? []) {
    if (!photoByItem.has(p.item_id)) {
      photoByItem.set(p.item_id, p.storage_path);
    }
  }

  const bidderIds = [...new Set((bids ?? []).map((b) => b.bidder_id))];
  const aliasByBidder = new Map<string, string>();

  if (bidderIds.length > 0) {
    const { data: bidders } = await supabase
      .from("bidder_profiles")
      .select("id, public_alias")
      .in("id", bidderIds);

    for (const b of bidders ?? []) {
      aliasByBidder.set(b.id, b.public_alias);
    }
  }

  const bidsByItem = new Map<string, NonNullable<typeof bids>>();
  for (const bid of bids ?? []) {
    const list = bidsByItem.get(bid.item_id) ?? [];
    list.push(bid);
    bidsByItem.set(bid.item_id, list);
  }

  const winnerByItem = new Map<string, string>();
  for (const [itemId, itemBids] of bidsByItem) {
    const winnerBid =
      itemBids.find((b) => b.status === "winner") ??
      [...itemBids].sort((a, b) => b.amount - a.amount)[0];
    const alias = aliasByBidder.get(winnerBid.bidder_id);
    if (alias) winnerByItem.set(itemId, alias);
  }

  const rows: WinnerRow[] = items.map((item) => ({
    itemId: item.id,
    lotNumber: item.lot_number,
    itemName: item.item_name,
    startingPrice: item.starting_price,
    lastPrice: item.current_price,
    bidderAlias: winnerByItem.get(item.id) ?? null,
    photoPath: photoByItem.get(item.id) ?? null,
    periodCode: period!.code,
    periodTitle: period!.title,
  }));

  return { period, rows };
}
