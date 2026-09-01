import { createAdminClient } from "@/lib/supabase/admin";
import { getNikLookupVariants } from "@/lib/employee-registration";

export type AccountByNik = {
  userId: string;
  email: string;
  fullName: string;
  employeeNik: string;
};

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;

  if (local.length <= 2) {
    return `${local[0] ?? "*"}***@${domain}`;
  }

  return `${local.slice(0, 2)}${"*".repeat(Math.min(4, local.length - 2))}@${domain}`;
}

export async function findAccountByNik(
  employeeNik: string
): Promise<AccountByNik | null> {
  const variants = getNikLookupVariants(employeeNik);
  if (variants.length === 0) return null;

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, employee_nik")
    .in("employee_nik", variants)
    .maybeSingle();

  if (!profile?.employee_nik) {
    return null;
  }

  const { data: authUser, error } = await admin.auth.admin.getUserById(profile.id);
  if (error || !authUser.user?.email) {
    return null;
  }

  return {
    userId: profile.id,
    email: authUser.user.email.toLowerCase(),
    fullName: profile.full_name,
    employeeNik: profile.employee_nik,
  };
}
