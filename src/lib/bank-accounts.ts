import { createClient } from "@/lib/supabase/server";
import { AuctionBankAccount } from "@/lib/database.types";

export async function fetchActiveBankAccounts(): Promise<AuctionBankAccount[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("auction_bank_accounts")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  return data ?? [];
}
