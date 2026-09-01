import { createClient } from "@/lib/supabase/server";
import { Bank } from "@/lib/database.types";

export async function fetchBanks(): Promise<Bank[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("banks")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}
