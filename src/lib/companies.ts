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
