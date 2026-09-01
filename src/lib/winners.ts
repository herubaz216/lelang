import { createClient } from "@/lib/supabase/server";
import {
  AuctionBankAccount,
  AuctionPeriod,
  Company,
} from "@/lib/database.types";
import { fetchCompanies } from "@/lib/companies";
import { fetchActiveBankAccounts } from "@/lib/bank-accounts";

export type WinnerRow = {
  itemId: string;
  lotNumber: string;
  itemName: string;
  startingPrice: number;
  lastPrice: number;
  winnerName: string | null;
  winnerAlias: string | null;
  photoPath: string | null;
  periodCode: string;
  periodTitle: string;
};

export type CompanyWinnerGroup = {
  company: Company;
  period: AuctionPeriod;
  periods: AuctionPeriod[];
  rows: WinnerRow[];
  bankAccounts: AuctionBankAccount[];
};

export async function fetchFinishedPeriods(
  companyId: string
): Promise<AuctionPeriod[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("auction_periods")
    .select("*")
    .eq("company_id", companyId)
    .in("status", ["finished", "cancelled"])
    .order("end_at", { ascending: false });
  return data ?? [];
}

export async function fetchWinners(
  companyId: string,
  periodId?: string
): Promise<{
  period: AuctionPeriod | null;
  rows: WinnerRow[];
}> {
  const supabase = await createClient();

  let period: AuctionPeriod | null = null;

  if (periodId) {
    const { data } = await supabase
      .from("auction_periods")
      .select("*")
      .eq("id", periodId)
      .eq("company_id", companyId)
      .maybeSingle();
    period = data;
  } else {
    const { data } = await supabase
      .from("auction_periods")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "finished")
      .order("end_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    period = data;
  }

  if (!period) {
    return { period: null, rows: [] };
  }

  const { data: winnerRows, error } = await supabase.rpc("get_period_winners", {
    p_period_id: period.id,
  });

  if (error || !winnerRows?.length) {
    return { period, rows: [] };
  }

  const rows: WinnerRow[] = winnerRows.map((row) => ({
    itemId: row.item_id,
    lotNumber: row.lot_number,
    itemName: row.item_name,
    startingPrice: Number(row.starting_price),
    lastPrice: Number(row.last_price),
    winnerName: row.winner_name,
    winnerAlias: row.winner_alias,
    photoPath: row.photo_path,
    periodCode: period.code,
    periodTitle: period.title,
  }));

  return { period, rows };
}

export async function fetchCompanyWinnerGroups(options?: {
  companyCode?: string;
  periodId?: string;
}): Promise<CompanyWinnerGroup[]> {
  const companies = await fetchCompanies();
  const filteredCompanies = options?.companyCode
    ? companies.filter((company) => company.code === options.companyCode)
    : companies;

  const groups: CompanyWinnerGroup[] = [];

  for (const company of filteredCompanies) {
    const periods = await fetchFinishedPeriods(company.id);
    const finishedPeriods = periods.filter((period) => period.status === "finished");
    if (finishedPeriods.length === 0) continue;

    const selectedPeriod =
      (options?.periodId
        ? finishedPeriods.find((period) => period.id === options.periodId)
        : null) ?? finishedPeriods[0];

    const { period, rows } = await fetchWinners(company.id, selectedPeriod.id);
    if (!period) continue;

    const bankAccounts =
      period.status === "finished"
        ? await fetchActiveBankAccounts(company.id)
        : [];

    groups.push({
      company,
      period,
      periods: finishedPeriods,
      rows,
      bankAccounts,
    });
  }

  return groups;
}
