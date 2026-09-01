"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useAdminCompanyId } from "@/components/admin/admin-company-context";

type BidReport = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  auction_items: { lot_number: string; item_name: string } | null;
  bidder_profiles: { public_alias: string; full_name: string } | null;
};

type AuditEntry = {
  id: number;
  action: string;
  table_name: string;
  created_at: string;
};

export default function ReportsPage() {
  const [bids, setBids] = useState<BidReport[]>([]);
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const supabase = createClient();
  const companyId = useAdminCompanyId();

  useEffect(() => {
    async function load() {
      const { data: bidders } = await supabase
        .from("bidder_profiles")
        .select("id")
        .eq("company_id", companyId);
      const bidderIds = (bidders ?? []).map((bidder) => bidder.id);

      const [{ data: bidsData }, { data: auditsData }] = await Promise.all([
        bidderIds.length
          ? supabase
              .from("bids")
              .select(
                "id, amount, status, created_at, auction_items(lot_number, item_name), bidder_profiles(public_alias, full_name)"
              )
              .in("bidder_id", bidderIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
        supabase
          .from("audit_logs")
          .select("id, action, table_name, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      setBids((bidsData ?? []) as unknown as BidReport[]);
      setAudits(auditsData ?? []);
    }
    load();
  }, [companyId]);

  function exportCsv() {
    const header = "Lot,Barang,Bidder,Alias,Nominal,Status,Waktu\n";
    const rows = bids
      .map((b) => {
        const lot = b.auction_items?.lot_number ?? "";
        const item = b.auction_items?.item_name ?? "";
        const bidder = b.bidder_profiles?.full_name ?? "";
        const alias = b.bidder_profiles?.public_alias ?? "";
        return `"${lot}","${item}","${bidder}","${alias}",${b.amount},"${b.status}","${b.created_at}"`;
      })
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-lelang-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Laporan</h1>
          <p className="text-sm text-slate-500">Riwayat penawaran dan audit log</p>
        </div>
        <Button variant="primary" size="sm" className="w-full sm:w-auto" onClick={exportCsv} disabled={bids.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Penawaran ({bids.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {bids.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada penawaran.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-slate-500">
                    <th className="pb-3 pr-4">Lot</th>
                    <th className="pb-3 pr-4">Barang</th>
                    <th className="pb-3 pr-4">Bidder</th>
                    <th className="pb-3 pr-4">Nominal</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid) => (
                    <tr
                      key={bid.id}
                      className="border-b border-[var(--border)] text-slate-700"
                    >
                      <td className="py-3 pr-4 font-mono text-[var(--primary)]">
                        {bid.auction_items?.lot_number}
                      </td>
                      <td className="py-3 pr-4">{bid.auction_items?.item_name}</td>
                      <td className="py-3 pr-4">
                        {bid.bidder_profiles?.public_alias}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-slate-900">
                        {formatRupiah(bid.amount)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge status={bid.status} />
                      </td>
                      <td className="py-3">{formatDateTime(bid.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada log.</p>
          ) : (
            <div className="space-y-2">
              {audits.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-slate-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-medium text-slate-900">{log.action}</span>
                    <span className="ml-2 text-slate-500">{log.table_name}</span>
                  </div>
                  <span className="text-slate-500">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
