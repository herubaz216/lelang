import { createClient } from "@/lib/supabase/server";
import { BankAccountWithBank } from "@/lib/database.types";

const bankAccountSelect = "*, banks(id, code, name)";

export { getBankName } from "@/lib/bank-utils";

export async function fetchActiveBankAccounts(
  companyId: string
): Promise<BankAccountWithBank[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("auction_bank_accounts")
    .select(bankAccountSelect)
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  return (data ?? []) as BankAccountWithBank[];
}
