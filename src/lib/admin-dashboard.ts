import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type AppSupabase = SupabaseClient<Database>;

export type CompanyAssetTotals = {
  itemCount: number;
  startingTotal: number;
  biddingTotal: number;
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
    return { itemCount: 0, startingTotal: 0, biddingTotal: 0 };
  }

  const { data: items } = await supabase
    .from("auction_items")
    .select("starting_price, current_price")
    .in("period_id", periodIds);

  let startingTotal = 0;
  let biddingTotal = 0;

  for (const item of items ?? []) {
    startingTotal += item.starting_price;
    biddingTotal += item.current_price;
  }

  return {
    itemCount: items?.length ?? 0,
    startingTotal,
    biddingTotal,
  };
}
