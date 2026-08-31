"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BidderProfile } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const emptyForm = {
  employee_nik: "",
  ktp: "",
  full_name: "",
  public_alias: "",
  is_active: true,
};

export default function BiddersPage() {
  const [bidders, setBidders] = useState<BidderProfile[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase
      .from("bidder_profiles")
      .select("id, employee_nik, full_name, public_alias, is_active, created_at, updated_at, auth_user_id")
      .order("created_at", { ascending: false });
    setBidders((data ?? []) as BidderProfile[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.rpc("upsert_bidder", {
      p_employee_nik: form.employee_nik.trim(),
      p_ktp: form.ktp.trim(),
      p_full_name: form.full_name.trim(),
      p_public_alias: form.public_alias.trim(),
      p_is_active: form.is_active,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Bidder berhasil disimpan");
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Bidder</h1>
          <p className="text-sm text-slate-500">Kelola peserta lelang</p>
        </div>
        <Button variant="primary" size="sm" className="w-full sm:w-auto" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Bidder
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah / Update Bidder</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>NIK Karyawan</Label>
                <Input
                  value={form.employee_nik}
                  onChange={(e) =>
                    setForm({ ...form, employee_nik: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>NIK KTP</Label>
                <Input
                  type="password"
                  value={form.ktp}
                  onChange={(e) => setForm({ ...form, ktp: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Alias Publik</Label>
                <Input
                  value={form.public_alias}
                  onChange={(e) =>
                    setForm({ ...form, public_alias: e.target.value })
                  }
                  placeholder="Bidder A"
                  required
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {bidders.map((bidder) => (
          <Card key={bidder.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-[var(--primary)]">
                    {bidder.employee_nik}
                  </span>
                  <Badge status={bidder.is_active ? "active" : "cancelled"} />
                </div>
                <h3 className="font-semibold text-slate-900">{bidder.full_name}</h3>
                <p className="text-sm text-slate-500">
                  Alias: {bidder.public_alias}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
