import { createClient } from "@/lib/supabase/server";
import { AuctionBankAccount } from "@/lib/database.types";

export async function fetchActiveBankAccounts(
  companyId: string
): Promise<AuctionBankAccount[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("auction_bank_accounts")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  return data ?? [];
}
