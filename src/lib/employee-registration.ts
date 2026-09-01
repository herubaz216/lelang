import { createAdminClient } from "@/lib/supabase/admin";

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

export async function isEmployeeNikRegistered(
  employeeNik: string
): Promise<boolean> {
  const variants = getNikLookupVariants(employeeNik);
  if (variants.length === 0) return false;

  const admin = createAdminClient();

  const [{ count: profileCount }, { count: bidderCount }] = await Promise.all([
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("employee_nik", variants),
    admin
      .from("bidder_profiles")
      .select("id", { count: "exact", head: true })
      .in("employee_nik", variants),
  ]);

  return (profileCount ?? 0) > 0 || (bidderCount ?? 0) > 0;
}
