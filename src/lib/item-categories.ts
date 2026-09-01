import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type ItemCategory = Database["public"]["Tables"]["item_categories"]["Row"];

type AppSupabase = SupabaseClient<Database>;

export async function fetchItemCategories(
  supabase?: AppSupabase
): Promise<ItemCategory[]> {
  const client = supabase ?? createClient();
  const { data, error } = await client
    .from("item_categories")
    .select("id, name, sort_order, is_active, created_at")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}
