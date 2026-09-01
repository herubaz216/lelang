import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type AppSupabase = SupabaseClient<Database>;

export async function fetchBidderIdsWithCompanyBids(
  supabase: AppSupabase,
  companyId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("bids")
    .select("bidder_id, auction_items!inner(auction_periods!inner(company_id))")
    .eq("auction_items.auction_periods.company_id", companyId);

  if (error) {
    throw error;
  }

  return [...new Set((data ?? []).map((row) => row.bidder_id))];
}

export async function countCompanyBidsByBidder(
  supabase: AppSupabase,
  companyId: string,
  bidderIds: string[]
): Promise<Record<string, number>> {
  if (bidderIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("bids")
    .select("bidder_id, auction_items!inner(auction_periods!inner(company_id))")
    .eq("auction_items.auction_periods.company_id", companyId)
    .in("bidder_id", bidderIds);

  if (error) {
    throw error;
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.bidder_id] = (counts[row.bidder_id] ?? 0) + 1;
  }

  return counts;
}
