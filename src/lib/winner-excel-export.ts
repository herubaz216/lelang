import type { SupabaseClient } from "@supabase/supabase-js";
import { AuctionPeriod, Database } from "@/lib/database.types";
import { formatDateTime } from "@/lib/format";
import { getBankName } from "@/lib/bank-utils";

type WinnerRow =
  Database["public"]["Functions"]["get_period_winners"]["Returns"][number];

type WinnerNotificationRow =
  Database["public"]["Functions"]["get_period_winner_notifications"]["Returns"][number];

export async function fetchWinnerExportData(
  supabase: SupabaseClient<Database>,
  period: AuctionPeriod
) {
  const [{ data: company }, { data: winners, error: winnersError }, { data: notifications }] =
    await Promise.all([
      supabase
        .from("companies")
        .select("short_name, name")
        .eq("id", period.company_id)
        .maybeSingle(),
      supabase.rpc("get_period_winners", { p_period_id: period.id }),
      supabase.rpc("get_period_winner_notifications", { p_period_id: period.id }),
    ]);

  if (winnersError) {
    throw new Error(winnersError.message);
  }

  const { data: bankAccounts, error: bankError } = await supabase
    .from("auction_bank_accounts")
    .select("*, banks(id, code, name)")
    .eq("company_id", period.company_id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (bankError) {
    throw new Error(bankError.message);
  }

  return {
    period,
    company,
    winners: (winners ?? []) as WinnerRow[],
    notifications: (notifications ?? []) as WinnerNotificationRow[],
    bankAccounts: bankAccounts ?? [],
  };
}

export async function downloadWinnerExcel(
  supabase: SupabaseClient<Database>,
  period: AuctionPeriod
) {
  const data = await fetchWinnerExportData(supabase, period);
  const XLSX = await import("xlsx");

  const infoRows = [
    ["LAPORAN PEMENANG LELANG"],
    [],
    ["Perusahaan", data.company?.name ?? "-"],
    ["Kode Perusahaan", data.company?.short_name ?? "-"],
    ["Kode Periode", data.period.code],
    ["Judul Periode", data.period.title],
    ["Status", data.period.status],
    ["Mulai", formatDateTime(data.period.start_at)],
    ["Selesai", formatDateTime(data.period.end_at)],
    ["Total Barang Menang", data.winners.filter((row) => row.winner_alias).length],
    ["Diekspor", formatDateTime(new Date().toISOString())],
    [],
  ];

  const winnerHeader = [
    "No",
    "Lot",
    "Nama Barang",
    "Harga Awal",
    "Harga Menang",
    "Alias Pemenang",
    "Nama Pemenang",
    "Email Pemenang",
  ];

  const emailByBidder = new Map<string, string>();
  for (const row of data.notifications) {
    if (row.bidder_email) {
      emailByBidder.set(row.bidder_id, row.bidder_email);
    }
  }

  const bidderIdByItem = new Map(
    data.notifications.map((row) => [row.item_id, row.bidder_id])
  );

  const winnerRows = data.winners.map((row, index) => {
    const bidderId = bidderIdByItem.get(row.item_id);
    return [
      index + 1,
      row.lot_number,
      row.item_name,
      Number(row.starting_price),
      Number(row.last_price),
      row.winner_alias ?? "-",
      row.winner_name ?? "-",
      bidderId ? emailByBidder.get(bidderId) ?? "-" : "-",
    ];
  });

  const bankHeader = ["Bank", "Nomor Rekening", "Atas Nama", "Keterangan"];
  const bankRows = data.bankAccounts.map((account) => [
    getBankName(account),
    account.account_number,
    account.account_holder,
    account.notes ?? "-",
  ]);

  const summaryMap = new Map<
    string,
    { name: string; alias: string; email: string; items: number; total: number }
  >();

  for (const row of data.notifications) {
    const existing = summaryMap.get(row.bidder_id);
    const price = Number(row.last_price);
    if (existing) {
      existing.items += 1;
      existing.total += price;
      continue;
    }
    summaryMap.set(row.bidder_id, {
      name: row.bidder_name,
      alias: row.public_alias,
      email: row.bidder_email ?? "-",
      items: 1,
      total: price,
    });
  }

  const summaryHeader = [
    "Nama Pemenang",
    "Alias",
    "Email",
    "Jumlah Barang",
    "Total Pembayaran",
  ];
  const summaryRows = Array.from(summaryMap.values()).map((row) => [
    row.name,
    row.alias,
    row.email,
    row.items,
    row.total,
  ]);

  const workbook = XLSX.utils.book_new();
  const winnersSheet = XLSX.utils.aoa_to_sheet([
    ...infoRows,
    winnerHeader,
    ...winnerRows,
  ]);
  const banksSheet = XLSX.utils.aoa_to_sheet([bankHeader, ...bankRows]);
  const summarySheet = XLSX.utils.aoa_to_sheet([summaryHeader, ...summaryRows]);

  winnersSheet["!cols"] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
  ];
  banksSheet["!cols"] = [{ wch: 16 }, { wch: 18 }, { wch: 24 }, { wch: 28 }];
  summarySheet["!cols"] = [
    { wch: 24 },
    { wch: 16 },
    { wch: 28 },
    { wch: 14 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(workbook, winnersSheet, "Pemenang");
  XLSX.utils.book_append_sheet(workbook, banksSheet, "Rekening");
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan Pemenang");

  const safeCode = period.code.replace(/[^\w-]+/g, "_");
  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `pemenang-${safeCode}-${dateStamp}.xlsx`);
}
