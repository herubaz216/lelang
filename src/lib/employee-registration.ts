import { createAdminClient } from "@/lib/supabase/admin";
import type { Company } from "@/lib/database.types";

export function getNikLookupVariants(nik: string): string[] {
  const trimmed = nik.trim();
  if (!trimmed) return [];

  const variants = new Set<string>([trimmed]);

  const withoutLeadingZeros = trimmed.replace(/^0+/, "");
  if (withoutLeadingZeros) {
    variants.add(withoutLeadingZeros);
  }

  if (/^\d+$/.test(trimmed)) {
    variants.add(trimmed.padStart(8, "0"));
  }

  return [...variants];
}

/** Map HR PT name → company code heuristics. */
const PT_CODE_HINTS: Array<{ code: string; needles: string[] }> = [
  { code: "ams", needles: ["sejahtera", "ams"] },
  { code: "amg", needles: ["garmindo", "amg"] },
  { code: "amv", needles: ["visual", "amv"] },
];

export function inferCompanyCodeFromPt(ptName: string): string | null {
  const normalized = ptName.trim().toLowerCase();
  if (!normalized) return null;

  for (const hint of PT_CODE_HINTS) {
    if (hint.needles.some((needle) => normalized.includes(needle))) {
      return hint.code;
    }
  }
  return null;
}

export async function resolveCompanyFromPt(
  ptName: string
): Promise<Company | null> {
  const admin = createAdminClient();
  const { data: companies } = await admin
    .from("companies")
    .select("*")
    .order("code", { ascending: true });

  const list = companies ?? [];
  if (list.length === 0) return null;

  const normalized = ptName.trim().toLowerCase();
  if (!normalized) return null;

  const exact =
    list.find((company) => company.name.toLowerCase() === normalized) ??
    list.find((company) => company.short_name.toLowerCase() === normalized) ??
    list.find((company) => company.code.toLowerCase() === normalized);
  if (exact) return exact;

  const byInclude = list.find(
    (company) =>
      normalized.includes(company.short_name.toLowerCase()) ||
      normalized.includes(company.name.toLowerCase().replace(/^pt\.?\s*/i, "")) ||
      company.name.toLowerCase().includes(normalized)
  );
  if (byInclude) return byInclude;

  const code = inferCompanyCodeFromPt(ptName);
  if (code) {
    return list.find((company) => company.code.toLowerCase() === code) ?? null;
  }

  return null;
}

export async function isEmployeeNikRegistered(
  employeeNik: string,
  companyId?: string | null
): Promise<boolean> {
  const variants = getNikLookupVariants(employeeNik);
  if (variants.length === 0) return false;

  const admin = createAdminClient();

  let profileQuery = admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .in("employee_nik", variants);

  let bidderQuery = admin
    .from("bidder_profiles")
    .select("id", { count: "exact", head: true })
    .in("employee_nik", variants);

  if (companyId) {
    profileQuery = profileQuery.eq("company_id", companyId);
    bidderQuery = bidderQuery.eq("company_id", companyId);
  }

  const [{ count: profileCount }, { count: bidderCount }] = await Promise.all([
    profileQuery,
    bidderQuery,
  ]);

  return (profileCount ?? 0) > 0 || (bidderCount ?? 0) > 0;
}

export async function filterUnregisteredEmployeeMatches<
  T extends { nomorInduk: string; pt: string },
>(matches: T[]): Promise<Array<T & { companyId: string; companyCode: string }>> {
  const available: Array<T & { companyId: string; companyCode: string }> = [];

  for (const match of matches) {
    const company = await resolveCompanyFromPt(match.pt);
    if (!company) continue;

    const taken = await isEmployeeNikRegistered(match.nomorInduk, company.id);
    if (taken) continue;

    available.push({
      ...match,
      companyId: company.id,
      companyCode: company.code,
    });
  }

  return available;
}
