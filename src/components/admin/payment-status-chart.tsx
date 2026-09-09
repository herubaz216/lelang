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
import { CheckCircle2 } from "lucide-react";
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

export function PaymentStatusChart({ totals }: { totals: CompanyAssetTotals }) {
  const {
    paidTotal,
    unpaidBiddingTotal,
    paidItemCount,
    unpaidItemCount,
    itemsWithBids,
  } = totals;

  const chartData: ChartRow[] = [
    { name: "Sudah Lunas", value: paidTotal, color: "#059669" },
    { name: "Belum Lunas", value: unpaidBiddingTotal, color: "#f59e0b" },
  ];

  const hasData = itemsWithBids > 0 || paidItemCount > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-[var(--border)] bg-gradient-to-r from-emerald-50/80 to-teal-50/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Status Pelunasan</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Nilai barang yang sudah dikonfirmasi lunas vs belum
            </p>
          </div>
          {paidItemCount > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              {paidItemCount} barang lunas
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!hasData ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            Belum ada barang dengan bid untuk status pelunasan.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  Sudah Lunas
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-950">
                  {formatRupiah(paidTotal)}
                </p>
                <p className="mt-0.5 text-xs text-emerald-700/80">
                  {paidItemCount} barang terkonfirmasi
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                  Belum Lunas
                </p>
                <p className="mt-1 text-xl font-bold text-amber-950">
                  {formatRupiah(unpaidBiddingTotal)}
                </p>
                <p className="mt-0.5 text-xs text-amber-700/80">
                  {unpaidItemCount} barang sudah ada bid
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
                    <linearGradient id="barLunas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="barBelum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#d97706" />
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
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(16, 185, 129, 0.06)" }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={96}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={index === 0 ? "url(#barLunas)" : "url(#barBelum)"}
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
