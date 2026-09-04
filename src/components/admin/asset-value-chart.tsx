"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { CompanyAssetTotals } from "@/lib/admin-dashboard";

function formatRupiahCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${Math.round(amount / 1_000)} rb`;
  }
  return formatRupiah(amount);
}

type ChartRow = {
  name: string;
  value: number;
  color: string;
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}) {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-slate-500">{row.name}</p>
      <p className="text-sm font-bold text-slate-900">{formatRupiah(row.value)}</p>
    </div>
  );
}

export function AssetValueChart({ totals }: { totals: CompanyAssetTotals }) {
  const {
    startingTotal,
    biddingTotal,
    biddingBaseTotal,
    itemCount,
    itemsWithBids,
  } = totals;
  const uplift = biddingTotal - biddingBaseTotal;
  const upliftPct =
    biddingBaseTotal > 0
      ? Math.round((uplift / biddingBaseTotal) * 1000) / 10
      : 0;

  const chartData: ChartRow[] = [
    { name: "Nilai Awal", value: startingTotal, color: "#94a3b8" },
    { name: "Nilai Bidding", value: biddingTotal, color: "#4f46e5" },
  ];

  const hasData = itemCount > 0 && (startingTotal > 0 || biddingTotal > 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-[var(--border)] bg-gradient-to-r from-indigo-50/80 to-violet-50/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Nilai Aset Lelang</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Total harga awal vs jumlah bid tertinggi tiap barang
            </p>
          </div>
          {hasData && uplift !== 0 && (
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                uplift > 0
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              {uplift > 0 ? "+" : ""}
              {formatRupiahCompact(uplift)} ({uplift > 0 ? "+" : ""}
              {upliftPct}%)
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!hasData ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            Belum ada data barang lelang untuk ditampilkan.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total Nilai Awal
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {formatRupiah(startingTotal)}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{itemCount} barang</p>
              </div>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  Total Nilai Bidding
                </p>
                <p className="mt-1 text-xl font-bold text-indigo-950">
                  {formatRupiah(biddingTotal)}
                </p>
                <p className="mt-0.5 text-xs text-indigo-600/80">
                  Sum bid tertinggi · {itemsWithBids} barang sudah ada bid
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  barCategoryGap="28%"
                >
                  <defs>
                    <linearGradient id="barAwal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#cbd5e1" />
                      <stop offset="100%" stopColor="#94a3b8" />
                    </linearGradient>
                    <linearGradient id="barBidding" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={formatRupiahCompact}
                    width={72}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99, 102, 241, 0.06)" }} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={96}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={index === 0 ? "url(#barAwal)" : "url(#barBidding)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
