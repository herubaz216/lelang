"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuctionItem, AuctionPeriod } from "@/lib/database.types";
import { formatRupiah, formatNumberId, parseRupiahInput } from "@/lib/format";
import { isPeriodBiddingOpen } from "@/lib/auction";
import { notifyItemBidUpdate } from "@/lib/bid-events";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Gavel, Minus, Plus, Lock, LogIn } from "lucide-react";

type BidderInfo = {
  employeeNik: string;
  fullName: string;
};

export function BidForm({
  item,
  period,
  onSuccess,
}: {
  item: AuctionItem;
  period?: AuctionPeriod | null;
  onSuccess?: () => void;
}) {
  const pathname = usePathname();
  const loginHref = `/login?redirect=${encodeURIComponent(pathname)}`;
  const daftarHref = `/daftar?redirect=${encodeURIComponent(pathname)}`;

  const [currentPrice, setCurrentPrice] = useState(item.current_price);
  const minimum = currentPrice + item.bid_increment;
  const [amount, setAmount] = useState(item.current_price + item.bid_increment);
  const [amountDisplay, setAmountDisplay] = useState(
    formatNumberId(item.current_price + item.bid_increment)
  );
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [bidder, setBidder] = useState<BidderInfo | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadBidder() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setBidder(null);
        setAuthLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, employee_nik, role")
        .eq("id", user.id)
        .maybeSingle();

      const { data: bidderProfile } = await supabase
        .from("bidder_profiles")
        .select("employee_nik, full_name, is_active")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (bidderProfile?.is_active) {
        setBidder({
          employeeNik: bidderProfile.employee_nik,
          fullName: bidderProfile.full_name,
        });
      } else if (profile?.role === "bidder" && profile.employee_nik) {
        setBidder({
          employeeNik: profile.employee_nik,
          fullName: profile.full_name,
        });
      } else {
        setBidder(null);
      }

      setAuthLoading(false);
    }

    loadBidder();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadBidder();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    setCurrentPrice(item.current_price);
  }, [item.current_price]);

  useEffect(() => {
    const nextMinimum = currentPrice + item.bid_increment;
    setAmount((prev) => (prev < nextMinimum ? nextMinimum : prev));
    setAmountDisplay((prev) => {
      const parsed = parseRupiahInput(prev);
      return formatNumberId(parsed < nextMinimum ? nextMinimum : parsed);
    });
  }, [currentPrice, item.bid_increment]);

  function updateAmount(value: number) {
    const clamped = Math.max(value, minimum);
    const aligned =
      minimum + Math.ceil((clamped - minimum) / item.bid_increment) * item.bid_increment;
    setAmount(aligned);
    setAmountDisplay(formatNumberId(aligned));
  }

  function handleAmountChange(raw: string) {
    setAmountDisplay(raw);
    const parsed = parseRupiahInput(raw);
    if (parsed > 0) setAmount(parsed);
  }

  function handleAmountBlur() {
    updateAmount(amount);
  }

  const biddingOpen = isPeriodBiddingOpen(period);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!bidder) {
      toast.error("Silakan login terlebih dahulu");
      return;
    }

    if (!biddingOpen) {
      toast.error("Periode lelang telah selesai. Penawaran ditutup.");
      return;
    }

    if (amount < minimum) {
      toast.error(`Minimum penawaran ${formatRupiah(minimum)}`);
      return;
    }

    if ((amount - minimum) % item.bid_increment !== 0) {
      toast.error(`Nominal harus kelipatan ${formatRupiah(item.bid_increment)}`);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("place_authenticated_bid", {
      p_item_id: item.id,
      p_amount: amount,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const result = data as { message?: string };
    toast.success(result?.message ?? "Penawaran berhasil!");
    setCurrentPrice(amount);
    updateAmount(amount + item.bid_increment);
    notifyItemBidUpdate(item.id);
    onSuccess?.();
  }

  if (!biddingOpen) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Lock className="h-5 w-5 text-slate-500" />
          </div>
          <p className="font-medium text-slate-900">Penawaran Ditutup</p>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Periode lelang telah selesai. Tidak dapat mengajukan penawaran untuk barang ini.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (item.status !== "active") {
    return (
      <Card>
        <CardContent className="py-10 text-center text-slate-500">
          Lelang untuk barang ini tidak sedang aktif.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-[var(--primary)]" />
          <CardTitle>Ajukan Penawaran</CardTitle>
        </div>
        <p className="text-sm text-slate-500">
          Minimum {formatRupiah(minimum)} &middot; Kelipatan{" "}
          {formatRupiah(item.bid_increment)}
        </p>
      </CardHeader>
      <CardContent>
        {authLoading ? (
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ) : !bidder ? (
          <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-5 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
              <LogIn className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <p className="text-sm text-slate-600">
              Silahkan{" "}
              <Link href={loginHref} className="font-semibold text-[var(--primary)] hover:underline">
                Login
              </Link>{" "}
              /{" "}
              <Link href={daftarHref} className="font-semibold text-[var(--primary)] hover:underline">
                Daftar
              </Link>{" "}
              jika belum memiliki akun
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl border border-[var(--border)] bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">NIK Karyawan</p>
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {bidder.employeeNik}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Nama Karyawan</p>
                  <p className="text-sm font-semibold text-slate-900">{bidder.fullName}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Nominal Penawaran</Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateAmount(amount - item.bid_increment)}
                  disabled={amount - item.bid_increment < minimum}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-slate-600 disabled:opacity-40"
                  aria-label="Kurangi"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                    Rp
                  </span>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    value={amountDisplay}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    onBlur={handleAmountBlur}
                    className="pl-10 text-right font-semibold tabular-nums"
                    placeholder="0"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => updateAmount(amount + item.bid_increment)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-slate-600"
                  aria-label="Tambah"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-right text-xs text-slate-500">= {formatRupiah(amount)}</p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Memproses..." : "Kirim Penawaran"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
