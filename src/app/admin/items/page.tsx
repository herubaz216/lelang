"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuctionItem, AuctionPeriod } from "@/lib/database.types";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Upload } from "lucide-react";

const emptyForm = {
  period_id: "",
  lot_number: "",
  item_name: "",
  category: "",
  description: "",
  item_condition: "",
  starting_price: "0",
  bid_increment: "10000",
  status: "draft",
};

export default function ItemsPage() {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [periods, setPeriods] = useState<AuctionPeriod[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function load() {
    const [{ data: itemsData }, { data: periodsData }] = await Promise.all([
      supabase.from("auction_items").select("*").order("lot_number"),
      supabase.from("auction_periods").select("*").order("code"),
    ]);
    setItems(itemsData ?? []);
    setPeriods(periodsData ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(item: AuctionItem) {
    setEditingId(item.id);
    setForm({
      period_id: item.period_id,
      lot_number: item.lot_number,
      item_name: item.item_name,
      category: item.category ?? "",
      description: item.description,
      item_condition: item.item_condition ?? "",
      starting_price: String(item.starting_price),
      bid_increment: String(item.bid_increment),
      status: item.status,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const startingPrice = Number(form.starting_price);
    const payload = {
      period_id: form.period_id,
      lot_number: form.lot_number.trim(),
      item_name: form.item_name.trim(),
      category: form.category.trim() || null,
      description: form.description.trim(),
      item_condition: form.item_condition.trim() || null,
      starting_price: startingPrice,
      current_price: editingId ? undefined : startingPrice,
      bid_increment: Number(form.bid_increment),
      status: form.status,
    };

    const { error } = editingId
      ? await supabase.from("auction_items").update(payload).eq("id", editingId)
      : await supabase.from("auction_items").insert(payload);

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(editingId ? "Barang diperbarui" : "Barang ditambahkan");
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    load();
  }

  async function handlePhotoUpload(itemId: string, file: File) {
    const ext = file.name.split(".").pop();
    const path = `${itemId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("auction-photos")
      .upload(path, file);

    if (uploadError) {
      toast.error(uploadError.message);
      return;
    }

    const { count } = await supabase
      .from("item_photos")
      .select("*", { count: "exact", head: true })
      .eq("item_id", itemId);

    const { error: dbError } = await supabase.from("item_photos").insert({
      item_id: itemId,
      storage_path: path,
      sort_order: (count ?? 0) + 1,
    });

    if (dbError) {
      toast.error(dbError.message);
      return;
    }

    toast.success("Foto berhasil diupload");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Barang Lelang</h1>
          <p className="text-slate-400">Kelola lot dan foto barang</p>
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
          Tambah Barang
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit" : "Tambah"} Barang</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Periode</Label>
                <Select
                  value={form.period_id}
                  onChange={(e) =>
                    setForm({ ...form, period_id: e.target.value })
                  }
                  required
                >
                  <option value="">Pilih periode</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.title}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>No. Lot</Label>
                <Input
                  value={form.lot_number}
                  onChange={(e) =>
                    setForm({ ...form, lot_number: e.target.value })
                  }
                  placeholder="LOT 001"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Nama Barang</Label>
                <Input
                  value={form.item_name}
                  onChange={(e) =>
                    setForm({ ...form, item_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="unsold">Unsold</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Kondisi</Label>
                <Input
                  value={form.item_condition}
                  onChange={(e) =>
                    setForm({ ...form, item_condition: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Harga Awal</Label>
                <Input
                  type="number"
                  value={form.starting_price}
                  onChange={(e) =>
                    setForm({ ...form, starting_price: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Kelipatan Bid</Label>
                <Input
                  type="number"
                  min={10000}
                  step={10000}
                  value={form.bid_increment}
                  onChange={(e) =>
                    setForm({ ...form, bid_increment: e.target.value })
                  }
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
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-amber-400">
                    {item.lot_number}
                  </span>
                  <Badge status={item.status} />
                </div>
                <h3 className="font-semibold text-white">{item.item_name}</h3>
                <p className="text-sm text-slate-400">
                  {formatRupiah(item.current_price)} — {item.category}
                </p>
              </div>
              <div className="flex gap-2">
                <label className="inline-flex cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(item.id, file);
                    }}
                  />
                  <span className="inline-flex h-8 items-center justify-center rounded-lg border border-white/20 bg-transparent px-3 text-white hover:bg-white/10">
                    <Upload className="h-4 w-4" />
                  </span>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(item)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
