import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AuctionItem,
  AuctionPeriod,
  Database,
} from "@/lib/database.types";
import { formatDateTime } from "@/lib/format";

type WinnerRow =
  Database["public"]["Functions"]["get_period_winners"]["Returns"][number];

type BidExportRow = {
  id: string;
  item_id: string;
  amount: number;
  status: string;
  created_at: string;
  bidder_profiles: {
    full_name: string;
    public_alias: string;
    employee_nik: string;
  } | null;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Aktif",
  ready: "Siap",
  sold: "Terjual",
  unsold: "Tidak Laku",
  cancelled: "Dibatalkan",
  finished: "Selesai",
};

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

export async function fetchPeriodExportData(
  supabase: SupabaseClient<Database>,
  period: AuctionPeriod
) {
  const [{ data: items, error: itemsError }, { data: company }] =
    await Promise.all([
      supabase
        .from("auction_items")
        .select("*")
        .eq("period_id", period.id)
        .order("lot_number"),
      supabase
        .from("companies")
        .select("short_name, name")
        .eq("id", period.company_id)
        .maybeSingle(),
    ]);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const periodItems = items ?? [];
  const itemIds = periodItems.map((item) => item.id);

  let bidCounts: Record<string, number> = {};
  let bids: BidExportRow[] = [];

  if (itemIds.length > 0) {
    const { data: bidsData, error: bidsError } = await supabase
      .from("bids")
      .select(
        "id, item_id, amount, status, created_at, bidder_profiles(full_name, public_alias, employee_nik)"
      )
      .in("item_id", itemIds)
      .order("created_at", { ascending: false });

    if (bidsError) {
      throw new Error(bidsError.message);
    }

    bids = (bidsData ?? []) as unknown as BidExportRow[];
    for (const bid of bids) {
      bidCounts[bid.item_id] = (bidCounts[bid.item_id] ?? 0) + 1;
    }
  }

  let winners: WinnerRow[] = [];
  if (period.status === "finished" || period.status === "cancelled") {
    const { data, error } = await supabase.rpc("get_period_winners", {
      p_period_id: period.id,
    });
    if (error) {
      throw new Error(error.message);
    }
    winners = data ?? [];
  }

  const winnerByItem = new Map(winners.map((row) => [row.item_id, row]));
  const itemById = new Map(periodItems.map((item) => [item.id, item]));

  return {
    period,
    company,
    items: periodItems,
    bids,
    bidCounts,
    winnerByItem,
    itemById,
  };
}

export async function downloadPeriodExcel(
  supabase: SupabaseClient<Database>,
  period: AuctionPeriod
) {
  const data = await fetchPeriodExportData(supabase, period);
  const XLSX = await import("xlsx");

  const infoRows = [
    ["LAPORAN BARANG LELANG"],
    [],
    ["Perusahaan", data.company?.name ?? "-"],
    ["Kode Perusahaan", data.company?.short_name ?? "-"],
    ["Kode Periode", data.period.code],
    ["Judul Periode", data.period.title],
    ["Status Periode", statusLabel(data.period.status)],
    ["Deskripsi", data.period.description ?? "-"],
    ["Mulai", formatDateTime(data.period.start_at)],
    ["Selesai", formatDateTime(data.period.end_at)],
    ["Total Barang", data.items.length],
    ["Diekspor", formatDateTime(new Date().toISOString())],
    [],
  ];

  const itemHeader = [
    "No",
    "Lot",
    "Nama Barang",
    "Kategori",
    "Kondisi",
    "Deskripsi",
    "Harga Awal",
    "Kelipatan Bid",
    "Harga Terakhir",
    "Status",
    "Jumlah Bid",
    "Pemenang (Alias)",
    "Nama Pemenang",
    "Harga Menang",
    "Dibuat",
    "Diperbarui",
  ];

  const itemRows = data.items.map((item: AuctionItem, index) => {
    const winner = data.winnerByItem.get(item.id);
    return [
      index + 1,
      item.lot_number,
      item.item_name,
      item.category ?? "-",
      item.item_condition ?? "-",
      item.description,
      item.starting_price,
      item.bid_increment,
      item.current_price,
      statusLabel(item.status),
      data.bidCounts[item.id] ?? 0,
      winner?.winner_alias ?? "-",
      winner?.winner_name ?? "-",
      winner?.last_price ?? item.current_price,
      formatDateTime(item.created_at),
      formatDateTime(item.updated_at),
    ];
  });

  const bidHeader = [
    "Lot",
    "Nama Barang",
    "NIK Bidder",
    "Nama Bidder",
    "Alias",
    "Nominal Bid",
    "Status Bid",
    "Waktu Bid",
  ];

  const bidRows = data.bids.map((bid) => {
    const item = data.itemById.get(bid.item_id);
    return [
      item?.lot_number ?? "-",
      item?.item_name ?? "-",
      bid.bidder_profiles?.employee_nik ?? "-",
      bid.bidder_profiles?.full_name ?? "-",
      bid.bidder_profiles?.public_alias ?? "-",
      bid.amount,
      statusLabel(bid.status),
      formatDateTime(bid.created_at),
    ];
  });

  const summaryRows = [
    ["RINGKASAN"],
    [],
    ["Total Barang", data.items.length],
    ["Total Bid", data.bids.length],
    [
      "Total Nilai Harga Terakhir",
      data.items.reduce((sum, item) => sum + Number(item.current_price), 0),
    ],
    [
      "Total Nilai Menang",
      Array.from(data.winnerByItem.values()).reduce(
        (sum, row) => sum + Number(row.last_price),
        0
      ),
    ],
    [],
    ["Catatan"],
    ["Kolom harga numerik dapat diformat di Excel sebagai mata uang Rupiah."],
  ];

  const workbook = XLSX.utils.book_new();

  const infoSheet = XLSX.utils.aoa_to_sheet([...infoRows, itemHeader, ...itemRows]);
  const bidsSheet = XLSX.utils.aoa_to_sheet([bidHeader, ...bidRows]);
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);

  infoSheet["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 28 },
    { wch: 16 },
    { wch: 14 },
    { wch: 40 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 22 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
  ];
  bidsSheet["!cols"] = [
    { wch: 12 },
    { wch: 28 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
  ];
  summarySheet["!cols"] = [{ wch: 28 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(workbook, infoSheet, "Barang Lelang");
  XLSX.utils.book_append_sheet(workbook, bidsSheet, "Riwayat Bid");
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");

  const safeCode = period.code.replace(/[^\w-]+/g, "_");
  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `lelang-${safeCode}-${dateStamp}.xlsx`);
}
