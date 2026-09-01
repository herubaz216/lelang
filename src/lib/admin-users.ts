import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_PAGE_SIZE } from "@/components/ui/pagination";

export type RegisteredUserRow = {
  id: string;
  employee_nik: string;
  full_name: string;
  public_alias: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  auth_user_id: string | null;
  company_id: string;
  username: string | null;
  bid_count: number;
  company_code: string | null;
  company_name: string | null;
};

export async function fetchRegisteredUsers({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<{ users: RegisteredUserRow[]; total: number }> {
  const admin = createAdminClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const term = search.trim();

  let query = admin
    .from("bidder_profiles")
    .select(
      "id, employee_nik, full_name, public_alias, is_active, created_at, updated_at, auth_user_id, company_id",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (term) {
    const pattern = `%${term}%`;
    query = query.or(
      `employee_nik.ilike.${pattern},full_name.ilike.${pattern},public_alias.ilike.${pattern}`
    );
  }

  const { data, count, error } = await query.range(from, to);
  if (error) {
    throw error;
  }

  const users = data ?? [];
  const userIds = users.map((user) => user.id);
  const authIds = users
    .map((user) => user.auth_user_id)
    .filter((id): id is string => Boolean(id));
  const companyIds = [...new Set(users.map((user) => user.company_id))];

  const [{ data: profiles }, { data: companies }, { data: bids }] = await Promise.all([
    authIds.length
      ? admin.from("profiles").select("id, username").in("id", authIds)
      : Promise.resolve({ data: [] }),
    companyIds.length
      ? admin.from("companies").select("id, code, short_name").in("id", companyIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? admin.from("bids").select("bidder_id").in("bidder_id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const usernameByAuthId = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.username])
  );
  const companyById = new Map(
    (companies ?? []).map((company) => [
      company.id,
      { code: company.code, name: company.short_name },
    ])
  );
  const bidCountByUser = new Map<string, number>();
  for (const bid of bids ?? []) {
    bidCountByUser.set(bid.bidder_id, (bidCountByUser.get(bid.bidder_id) ?? 0) + 1);
  }

  return {
    users: users.map((user) => {
      const company = companyById.get(user.company_id);
      return {
        ...user,
        username: user.auth_user_id
          ? usernameByAuthId.get(user.auth_user_id) ?? null
          : null,
        bid_count: bidCountByUser.get(user.id) ?? 0,
        company_code: company?.code ?? null,
        company_name: company?.name ?? null,
      };
    }),
    total: count ?? 0,
  };
}
