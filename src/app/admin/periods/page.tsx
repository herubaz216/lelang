"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuctionPeriod } from "@/lib/database.types";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";

const emptyForm = {
  code: "",
  title: "",
  description: "",
  start_at: "",
  end_at: "",
  status: "draft",
};

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<AuctionPeriod[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase
      .from("auction_periods")
      .select("*")
      .order("created_at", { ascending: false });
    setPeriods(data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  function toLocalDatetime(iso: string) {
    if (!iso) return "";
    const d = new Date(iso);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  function startEdit(period: AuctionPeriod) {
    setEditingId(period.id);
    setForm({
      code: period.code,
      title: period.title,
      description: period.description ?? "",
      start_at: toLocalDatetime(period.start_at),
      end_at: toLocalDatetime(period.end_at),
      status: period.status,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      code: form.code.trim(),
      title: form.title.trim(),
      description: form.description.trim() || null,
      start_at: new Date(form.start_at).toISOString(),
      end_at: new Date(form.end_at).toISOString(),
      status: form.status,
    };

    const { error } = editingId
      ? await supabase.from("auction_periods").update(payload).eq("id", editingId)
      : await supabase.from("auction_periods").insert(payload);

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(editingId ? "Periode diperbarui" : "Periode dibuat");
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Periode Lelang</h1>
          <p className="text-slate-400">Kelola periode lelang</p>
        </div>
        <Button
          variant="gold"
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(!showForm);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Periode
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit" : "Tambah"} Periode</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Kode</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="AUG-2026"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="finished">Finished</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Judul</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Mulai</Label>
                <Input
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) =>
                    setForm({ ...form, start_at: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Selesai</Label>
                <Input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" variant="gold" disabled={loading}>
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
        {periods.map((period) => (
          <Card key={period.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-amber-400">
                    {period.code}
                  </span>
                  <Badge status={period.status} />
                </div>
                <h3 className="font-semibold text-white">{period.title}</h3>
                <p className="text-sm text-slate-400">
                  {formatDateTime(period.start_at)} —{" "}
                  {formatDateTime(period.end_at)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => startEdit(period)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
