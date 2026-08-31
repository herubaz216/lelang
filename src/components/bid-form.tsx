"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuctionItem } from "@/lib/database.types";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function BidForm({
  item,
  onSuccess,
}: {
  item: AuctionItem;
  onSuccess?: () => void;
}) {
  const [employeeNik, setEmployeeNik] = useState("");
  const [ktp, setKtp] = useState("");
  const [amount, setAmount] = useState(
    String(item.current_price + item.bid_increment)
  );
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const minimum = item.current_price + item.bid_increment;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.rpc("place_public_bid", {
      p_item_id: item.id,
      p_employee_nik: employeeNik.trim(),
      p_ktp: ktp.trim(),
      p_amount: Number(amount),
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const result = data as { success?: boolean; message?: string };
    toast.success(result?.message ?? "Penawaran berhasil!");
    setAmount(String(Number(amount) + item.bid_increment));
    onSuccess?.();
  }

  if (item.status !== "active") {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-400">
          Lelang untuk barang ini tidak sedang aktif.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajukan Penawaran</CardTitle>
        <p className="text-sm text-slate-400">
          Minimum: {formatRupiah(minimum)} (kelipatan{" "}
          {formatRupiah(item.bid_increment)})
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nik">NIK Karyawan</Label>
            <Input
              id="nik"
              value={employeeNik}
              onChange={(e) => setEmployeeNik(e.target.value)}
              placeholder="Masukkan NIK karyawan"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ktp">NIK KTP</Label>
            <Input
              id="ktp"
              type="password"
              value={ktp}
              onChange={(e) => setKtp(e.target.value)}
              placeholder="Masukkan NIK KTP"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Nominal Penawaran (Rp)</Label>
            <Input
              id="amount"
              type="number"
              min={minimum}
              step={item.bid_increment}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            variant="gold"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Kirim Penawaran"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
