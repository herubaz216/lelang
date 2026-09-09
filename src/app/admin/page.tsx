import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import {
  fetchCompanyAssetTotals,
  fetchDashboardPeriods,
} from "@/lib/admin-dashboard";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

export default async function AdminDashboard() {
  const profile = await requireStaff();
  const supabase = await createClient();
  const companyId = profile.company_id;

  const [assetTotals, dashboardPeriods] = await Promise.all([
    fetchCompanyAssetTotals(supabase, companyId),
    fetchDashboardPeriods(supabase, companyId),
  ]);

  const { data: companyPeriods } = await supabase
    .from("auction_periods")
    .select("id")
    .eq("company_id", companyId);
  const periodIds = (companyPeriods ?? []).map((period) => period.id);

  const { data: companyBidders } = await supabase
    .from("bidder_profiles")
    .select("id")
    .eq("company_id", companyId);
  const bidderIds = (companyBidders ?? []).map((bidder) => bidder.id);

  const [
    { count: itemCount },
    { count: bidCount },
    { count: periodCount },
    { count: bidderCount },
  ] = await Promise.all([
    periodIds.length
      ? supabase
          .from("auction_items")
          .select("*", { count: "exact", head: true })
          .in("period_id", periodIds)
      : Promise.resolve({ count: 0 }),
    bidderIds.length
      ? supabase
          .from("bids")
          .select("*", { count: "exact", head: true })
          .in("bidder_id", bidderIds)
      : Promise.resolve({ count: 0 }),
    supabase
      .from("auction_periods")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId),
    supabase
      .from("bidder_profiles")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId),
  ]);

  return (
    <AdminDashboardClient
      initialTotals={assetTotals}
      initialPeriods={dashboardPeriods}
      initialStats={{
        itemCount: itemCount ?? 0,
        bidCount: bidCount ?? 0,
        periodCount: periodCount ?? 0,
        bidderCount: bidderCount ?? 0,
      }}
    />
  );
}
