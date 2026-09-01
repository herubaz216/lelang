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
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !allowedRoles.includes(profile.role as UserRole)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  return { profile, user } as const;
}
