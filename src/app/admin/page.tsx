import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Gavel, Calendar, Users } from "lucide-react";

export default async function AdminDashboard() {
  await requireStaff();
  const supabase = await createClient();

  const [
    { count: itemCount },
    { count: bidCount },
    { count: periodCount },
    { count: bidderCount },
    { data: activePeriod },
  ] = await Promise.all([
    supabase.from("auction_items").select("*", { count: "exact", head: true }),
    supabase.from("bids").select("*", { count: "exact", head: true }),
    supabase.from("auction_periods").select("*", { count: "exact", head: true }),
    supabase.from("bidder_profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("auction_periods")
      .select("*")
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const stats = [
    { label: "Total Barang", value: itemCount ?? 0, icon: Package },
    { label: "Total Bid", value: bidCount ?? 0, icon: Gavel },
    { label: "Periode", value: periodCount ?? 0, icon: Calendar },
    { label: "Bidder", value: bidderCount ?? 0, icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Ringkasan platform lelang</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                <Icon className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activePeriod && (
        <Card>
          <CardHeader>
            <CardTitle>Periode Aktif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-slate-900">
                {activePeriod.title}
              </h3>
              <Badge status={activePeriod.status} />
            </div>
            <p className="text-sm text-slate-500">{activePeriod.code}</p>
            <p className="text-sm text-slate-600">{activePeriod.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
