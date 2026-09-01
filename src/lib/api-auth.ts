import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/database.types";
import { STAFF_ROLES } from "@/lib/roles";

export async function requireStaffApi(
  allowedRoles: UserRole[] = STAFF_ROLES
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !allowedRoles.includes(profile.role as UserRole)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  return { profile, user, supabase } as const;
}

export async function requireAmsStaffApi(
  allowedRoles: UserRole[] = STAFF_ROLES
) {
  const auth = await requireStaffApi(allowedRoles);
  if ("error" in auth) return auth;

  const { data: company } = await auth.supabase
    .from("companies")
    .select("code")
    .eq("id", auth.profile.company_id)
    .maybeSingle();

  if (company?.code !== "ams") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  return auth;
}
