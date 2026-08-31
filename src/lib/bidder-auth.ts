import type { SupabaseClient, User } from "@supabase/supabase-js";

function readBidderMeta(user: User) {
  const meta = user.user_metadata ?? {};
  const nik = String(meta.employee_nik ?? "").trim();
  const name = String(meta.full_name ?? meta.name ?? "").trim();
  const role = String(meta.role ?? "bidder");

  return { nik, name, role };
}

/** Keep profiles + bidder_profiles in sync after signup or login. */
export async function ensureBidderProfile(
  supabase: SupabaseClient,
  user: User,
  fallback?: { nik: string; name: string }
) {
  const fromMeta = readBidderMeta(user);
  const nik = fallback?.nik || fromMeta.nik;
  const name = fallback?.name || fromMeta.name;

  if (fromMeta.role !== "bidder" || !nik || !name) {
    return { error: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("employee_nik, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: bidderProfile } = await supabase
    .from("bidder_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const profileComplete =
    profile?.role === "bidder" && profile.employee_nik && profile.full_name;
  const bidderComplete = Boolean(bidderProfile);

  if (profileComplete && bidderComplete) {
    return { error: null };
  }

  const { error } = await supabase.rpc("register_bidder_profile", {
    p_employee_nik: nik,
    p_full_name: name,
  });

  if (!error) {
    return { error: null };
  }

  const { error: syncError } = await supabase.rpc("sync_bidder_profile_from_auth");
  return { error: syncError ?? error };
}
