import { createClient } from "@/lib/supabase/server";
import { Profile, UserRole } from "@/lib/database.types";
import { STAFF_ROLES } from "@/lib/roles";
import { redirect } from "next/navigation";

export async function getStaffProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return profile;
}

export async function requireStaff(allowedRoles: UserRole[] = STAFF_ROLES) {
  const profile = await getStaffProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!allowedRoles.includes(profile.role as UserRole)) {
    redirect("/");
  }

  return profile;
}
