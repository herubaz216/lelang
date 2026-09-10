import { createClient } from "@/lib/supabase/server";
import { Company } from "@/lib/database.types";
import { DEFAULT_COMPANY_CODE, resolveCompanyCode } from "@/lib/company-utils";

export { DEFAULT_COMPANY_CODE, resolveCompanyCode, withCompanyQuery } from "@/lib/company-utils";

export async function fetchCompanies(): Promise<Company[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .order("code", { ascending: true });
  return data ?? [];
}

/** Companies that currently have a browsable auction (active or finished). */
export async function fetchCompaniesWithAuction(): Promise<Company[]> {
  const supabase = await createClient();
  const [{ data: companies }, { data: periods }] = await Promise.all([
    supabase.from("companies").select("*").order("code", { ascending: true }),
    supabase
      .from("auction_periods")
      .select("company_id")
      .in("status", ["active", "finished"]),
  ]);

  const list = companies ?? [];
  if (list.length === 0) return [];

  const companyIdsWithAuction = new Set(
    (periods ?? []).map((period) => period.company_id)
  );

  const filtered = list.filter((company) =>
    companyIdsWithAuction.has(company.id)
  );

  // Keep site usable if no displayable auctions yet.
  return filtered.length > 0 ? filtered : list;
}

export async function fetchCompanyById(id: string): Promise<Company | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function fetchCompanyByCode(code: string): Promise<Company | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("code", code.toLowerCase())
    .maybeSingle();
  return data;
}
