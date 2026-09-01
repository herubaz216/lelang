import { createClient } from "@/lib/supabase/server";
import { AuctionPeriod } from "@/lib/database.types";

export async function fetchDisplayPeriod(
  companyId: string
): Promise<AuctionPeriod | null> {
  const supabase = await createClient();

  const { data: active } = await supabase
    .from("auction_periods")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("start_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (active) return active;

  const { data: finished } = await supabase
    .from("auction_periods")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "finished")
    .order("end_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return finished;
}
