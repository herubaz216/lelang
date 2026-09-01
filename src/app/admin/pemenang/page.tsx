"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuctionPeriod, Database } from "@/lib/database.types";
import { useAdminCompanyId } from "@/components/admin/admin-company-context";
import { PeriodWinnerEmailBar } from "@/components/admin/period-winner-email-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { downloadWinnerExcel } from "@/lib/winner-excel-export";
import { getBankName } from "@/lib/bank-utils";
import { BankAccountWithBank } from "@/lib/database.types";
import { toast } from "sonner";
import { Trophy, ArrowLeft, Download, Landmark, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type WinnerRow =
  Database["public"]["Functions"]["get_period_winners"]["Returns"][number];

type MobileView = "list" | "detail";

export default function AdminPemenangPage() {
  const [periods, setPeriods] = useState<AuctionPeriod[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [winners, setWinners] = useState<WinnerRow[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountWithBank[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const supabase = createClient();
  const companyId = useAdminCompanyId();

  const selectedPeriod = periods.find((period) => period.id === selectedId) ?? null;

  async function loadPeriods() {
    const { data } = await supabase
      .from("auction_periods")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "finished")
      .order("end_at", { ascending: false });

    const list = data ?? [];
    setPeriods(list);
    if (list.length > 0 && !selectedId) {
      setSelectedId(list[0].id);
    } else if (selectedId && !list.some((period) => period.id === selectedId)) {
      setSelectedId(list[0]?.id ?? null);
    }
  }

  async function loadWinners(periodId: string) {
    setLoadingWinners(true);
    const [{ data: winnerRows, error }, { data: banks }] = await Promise.all([
      supabase.rpc("get_period_winners", { p_period_id: periodId }),
      supabase
        .from("auction_bank_accounts")
        .select("*, banks(id, code, name)")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
    ]);

    setLoadingWinners(false);

    if (error) {
      toast.error(error.message);
      setWinners([]);
      setBankAccounts([]);
      return;
    }

    setWinners(winnerRows ?? []);
    setBankAccounts((banks ?? []) as BankAccountWithBank[]);
  }

  useEffect(() => {
    loadPeriods();
  }, [companyId]);

  useEffect(() => {
    if (selectedId) {
      loadWinners(selectedId);
    } else {
      setWinners([]);
      setBankAccounts([]);
    }
  }, [selectedId, companyId]);

  function selectPeriod(id: string) {
    setSelectedId(id);
    setMobileView("detail");
  }

  function backToList() {
    setMobileView("list");
  }

  async function handleExport() {
    if (!selectedPeriod) return;
    setExporting(true);
    try {
      await downloadWinnerExcel(supabase, selectedPeriod);
      toast.success("Excel pemenang berhasil diunduh");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengekspor data pemenang"
      );
    } finally {
      setExporting(false);
    }
  }

  const winnerCount = winners.filter((row) => row.winner_alias).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Info Pemenang</h1>
        <p className="text-sm text-slate-500">
          Daftar pemenang lelang per periode selesai
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <div
          className={cn(
            "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white lg:w-80 lg:shrink-0",
            mobileView === "detail" && "hidden lg:flex"
          )}
        >
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Periode Selesai</p>
            <p className="text-xs text-slate-500">{periods.length} periode</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {periods.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-12 text-center">
                <Package className="h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">
                  Belum ada periode yang selesai
                </p>
              </div>
            ) : (
              periods.map((period) => (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => selectPeriod(period.id)}
                  className={cn(
                    "mb-1 flex w-full flex-col rounded-xl p-3 text-left transition-colors",
                    selectedId === period.id
                      ? "bg-indigo-50 ring-1 ring-indigo-200"
                      : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[var(--primary)]">
                      {period.code}
                    </span>
                    <Badge status={period.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-900">
                    {period.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(period.end_at)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-white lg:flex lg:flex-col",
            mobileView === "list" && "hidden lg:flex"
          )}
        >
          {!selectedPeriod ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-slate-500">
              Pilih periode untuk melihat pemenang
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-start gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0 lg:hidden"
                    onClick={backToList}
                    aria-label="Kembali"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <p className="font-semibold text-slate-900">{selectedPeriod.title}</p>
                    </div>
                    <p className="font-mono text-xs text-[var(--primary)]">
                      {selectedPeriod.code}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {winnerCount} pemenang dari {winners.length} barang
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full shrink-0 sm:w-auto"
                  disabled={exporting || winners.length === 0}
                  onClick={() => void handleExport()}
                >
                  <Download className="h-4 w-4" />
                  {exporting ? "Mengekspor..." : "Export Excel"}
                </Button>
              </div>

              <PeriodWinnerEmailBar period={selectedPeriod} onSent={loadPeriods} />

              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                {bankAccounts.length > 0 && (
                  <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                        <Landmark className="h-5 w-5 text-emerald-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-slate-900">
                          Rekening Pembayaran
                        </h2>
                        <div className="mt-3 space-y-2">
                          {bankAccounts.map((account) => (
                            <div
                              key={account.id}
                              className="rounded-xl border border-emerald-200/80 bg-white px-4 py-3"
                            >
                              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                {getBankName(account)}
                              </p>
                              <p className="mt-1 font-mono text-sm font-semibold text-slate-900">
                                {account.account_number}
                              </p>
                              <p className="text-sm text-slate-700">
                                a.n. {account.account_holder}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {loadingWinners ? (
                  <div className="py-16 text-center text-sm text-slate-500">
                    Memuat data pemenang...
                  </div>
                ) : winners.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center text-slate-500">
                    Tidak ada barang dalam periode ini.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                    <div className="hidden grid-cols-[72px_1fr_120px_120px_140px_140px] gap-3 border-b border-[var(--border)] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
                      <span>Lot</span>
                      <span>Barang</span>
                      <span className="text-right">Harga Awal</span>
                      <span className="text-right">Harga Menang</span>
                      <span>Pemenang</span>
                      <span>Alias</span>
                    </div>
                    <ul className="divide-y divide-[var(--border)]">
                      {winners.map((row) => (
                        <li
                          key={row.item_id}
                          className="px-4 py-3 lg:grid lg:grid-cols-[72px_1fr_120px_120px_140px_140px] lg:items-center lg:gap-3"
                        >
                          <span className="font-mono text-xs font-semibold text-[var(--primary)]">
                            {row.lot_number}
                          </span>
                          <p className="mt-1 text-sm font-medium text-slate-900 lg:mt-0">
                            {row.item_name}
                          </p>
                          <p className="mt-2 text-sm text-slate-600 lg:mt-0 lg:text-right">
                            {formatRupiah(Number(row.starting_price))}
                          </p>
                          <p className="text-sm font-semibold text-emerald-700 lg:text-right">
                            {formatRupiah(Number(row.last_price))}
                          </p>
                          <p className="mt-2 text-sm text-slate-900 lg:mt-0">
                            {row.winner_name ?? "—"}
                          </p>
                          <p className="text-sm font-medium text-slate-700">
                            {row.winner_alias ?? "—"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
