"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { AuctionItem, ItemPhoto } from "@/lib/database.types";
import { formatRupiah, formatNumberId, parseRupiahInput, getPhotoUrl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Upload, Package, X, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PhotoSourcePicker } from "@/components/admin/photo-source-picker";
import { cn } from "@/lib/utils";
import { compressImageFile } from "@/lib/image-compress";

const MAX_PHOTOS = 5;

const emptyItemForm = {
  lot_number: "",
  item_name: "",
  category: "",
  description: "",
  item_condition: "",
  starting_price: "0",
  bid_increment: "10000",
  status: "draft",
};

function formatLotNumber(n: number): string {
  return `LOT ${String(n).padStart(3, "0")}`;
}

function getNextLotNumber(items: AuctionItem[]): string {
  let max = 0;
  for (const item of items) {
    const match = item.lot_number.match(/(\d+)\s*$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return formatLotNumber(max + 1);
}

const LOCKED_STATUSES = ["sold", "unsold", "cancelled"];

type ItemFormData = typeof emptyItemForm;

function RupiahInput({
  value,
  onChange,
  onBlurAlign,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlurAlign?: (parsed: number) => number;
  required?: boolean;
}) {
  const [display, setDisplay] = useState(() =>
    formatNumberId(parseRupiahInput(value || "0"))
  );

  useEffect(() => {
    setDisplay(formatNumberId(parseRupiahInput(value || "0")));
  }, [value]);

  function handleChange(raw: string) {
    setDisplay(raw);
    onChange(String(parseRupiahInput(raw)));
  }

  function handleBlur() {
    let parsed = parseRupiahInput(display);
    if (onBlurAlign) parsed = onBlurAlign(parsed);
    onChange(String(parsed));
    setDisplay(formatNumberId(parsed));
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
        Rp
      </span>
      <Input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className="pl-9 text-right tabular-nums"
        placeholder="0"
        required={required}
      />
    </div>
  );
}

function RupiahReadOnly({ value }: { value: string }) {
  return (
    <div className="flex h-9 items-center justify-end rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm tabular-nums text-slate-600">
      {formatRupiah(Number(value) || 0)}
    </div>
  );
}

function ItemForm({
  form,
  setForm,
  photos,
  editingId,
  loading,
  uploading,
  onSubmit,
  onCancel,
  onPhotoUpload,
  onPhotoDelete,
  title,
  isNew,
  canEditPricing,
}: {
  form: ItemFormData;
  setForm: React.Dispatch<React.SetStateAction<ItemFormData>>;
  photos: ItemPhoto[];
  editingId: string | null;
  loading: boolean;
  uploading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onPhotoUpload: (file: File) => void;
  onPhotoDelete: (photo: ItemPhoto) => void;
  title: string;
  isNew?: boolean;
  canEditPricing: boolean;
}) {
  const isActive = form.status === "active";
  const statusLocked = LOCKED_STATUSES.includes(form.status);

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4">
      <p className="mb-3 text-sm font-semibold text-slate-900">{title}</p>
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 sm:col-span-2">
          <div>
            <p className="text-xs text-slate-500">No. Lot</p>
            <p className="font-mono text-sm font-semibold text-[var(--primary)]">
              {form.lot_number || "—"}
            </p>
            {isNew && (
              <p className="text-[11px] text-slate-400">Otomatis berurutan</p>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {statusLocked ? (
              <Badge status={form.status} />
            ) : (
              <>
                <Label htmlFor="item-active" className="text-sm text-slate-600">
                  Aktif
                </Label>
                <Switch
                  id="item-active"
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, status: checked ? "active" : "draft" })
                  }
                />
              </>
            )}
          </div>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Nama Barang</Label>
          <Input
            value={form.item_name}
            onChange={(e) => setForm({ ...form, item_name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Kategori</Label>
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Kondisi</Label>
          <Input
            value={form.item_condition}
            onChange={(e) => setForm({ ...form, item_condition: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Deskripsi</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Harga Awal</Label>
          {canEditPricing ? (
            <RupiahInput
              value={form.starting_price}
              onChange={(v) => setForm({ ...form, starting_price: v })}
              onBlurAlign={(n) => Math.max(0, n)}
              required
            />
          ) : (
            <>
              <RupiahReadOnly value={form.starting_price} />
              <p className="text-xs text-slate-500">Hanya Akunting yang dapat mengubah</p>
            </>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Kelipatan Bid</Label>
          {canEditPricing ? (
            <>
              <RupiahInput
                value={form.bid_increment}
                onChange={(v) => setForm({ ...form, bid_increment: v })}
                onBlurAlign={(n) => Math.max(10000, Math.round(n / 10000) * 10000)}
                required
              />
              <p className="text-xs text-slate-500">Min. Rp 10.000, kelipatan 10.000</p>
            </>
          ) : (
            <>
              <RupiahReadOnly value={form.bid_increment} />
              <p className="text-xs text-slate-500">Hanya Akunting yang dapat mengubah</p>
            </>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label>
              Foto ({photos.length}/{MAX_PHOTOS})
            </Label>
            {!editingId && (
              <span className="text-xs text-slate-500">Simpan dulu untuk upload foto</span>
            )}
          </div>

          {editingId ? (
            <div className="flex flex-wrap gap-2">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative h-20 w-20 overflow-hidden rounded-lg border border-[var(--border)]"
                >
                  <Image
                    src={getPhotoUrl(photo.storage_path)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  <button
                    type="button"
                    onClick={() => onPhotoDelete(photo)}
                    className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                    aria-label="Hapus foto"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <PhotoSourcePicker
                  uploading={uploading}
                  onSelect={onPhotoUpload}
                />
              )}
            </div>
          ) : (
            <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white text-xs text-slate-400">
              <Upload className="mr-1.5 h-4 w-4" />
              Maks. {MAX_PHOTOS} foto setelah disimpan
            </div>
          )}
        </div>

        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}

function ItemRow({
  item,
  onEdit,
  onDelete,
  disabled,
}: {
  item: AuctionItem;
  onEdit: (item: AuctionItem) => void;
  onDelete: (item: AuctionItem) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border border-[var(--border)] bg-white p-4",
        disabled && "opacity-50"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold text-[var(--primary)]">
            {item.lot_number}
          </span>
          <Badge status={item.status} />
          {item.category && (
            <span className="text-xs text-slate-500">{item.category}</span>
          )}
        </div>
        <h3 className="mt-1 truncate font-medium text-slate-900">{item.item_name}</h3>
        <p className="text-sm text-slate-500">{formatRupiah(item.current_price)}</p>
      </div>
      <div className="ml-3 flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onEdit(item)}
          disabled={disabled}
          aria-label="Edit barang"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => onDelete(item)}
          disabled={disabled}
          aria-label="Hapus barang"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function PeriodItemsPanel({
  periodId,
  onItemsChange,
}: {
  periodId: string;
  onItemsChange?: () => void;
}) {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [photos, setPhotos] = useState<ItemPhoto[]>([]);
  const [form, setForm] = useState(emptyItemForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AuctionItem | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClient();

  const canEditPricing = userRole === "accounting";
  const isFormOpen = addingNew || editingId !== null;

  async function loadItems() {
    const { data } = await supabase
      .from("auction_items")
      .select("*")
      .eq("period_id", periodId)
      .order("lot_number");
    setItems(data ?? []);
  }

  async function loadPhotos(itemId: string) {
    const { data } = await supabase
      .from("item_photos")
      .select("*")
      .eq("item_id", itemId)
      .order("sort_order");
    setPhotos(data ?? []);
  }

  useEffect(() => {
    loadItems();
    setAddingNew(false);
    setEditingId(null);
    setPhotos([]);
  }, [periodId]);

  useEffect(() => {
    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      setUserRole(data?.role ?? null);
    }
    loadRole();
  }, [supabase]);

  useEffect(() => {
    if (editingId) {
      loadPhotos(editingId);
    } else if (!addingNew) {
      setPhotos([]);
    }
  }, [editingId, addingNew]);

  function startEdit(item: AuctionItem) {
    setAddingNew(false);
    setEditingId(item.id);
    setForm({
      lot_number: item.lot_number,
      item_name: item.item_name,
      category: item.category ?? "",
      description: item.description,
      item_condition: item.item_condition ?? "",
      starting_price: String(item.starting_price),
      bid_increment: String(item.bid_increment),
      status: item.status,
    });
  }

  function startAdd() {
    setEditingId(null);
    setForm({
      ...emptyItemForm,
      lot_number: getNextLotNumber(items),
    });
    setPhotos([]);
    setAddingNew(true);
  }

  function cancelForm() {
    setAddingNew(false);
    setEditingId(null);
    setForm(emptyItemForm);
    setPhotos([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const startingPrice = Number(form.starting_price);
    const bidIncrement = Number(form.bid_increment);

    const basePayload: {
      item_name: string;
      category: string | null;
      description: string;
      item_condition: string | null;
      status: string;
      starting_price?: number;
      bid_increment?: number;
    } = {
      item_name: form.item_name.trim(),
      category: form.category.trim() || null,
      description: form.description.trim(),
      item_condition: form.item_condition.trim() || null,
      status: form.status,
    };

    if (canEditPricing) {
      basePayload.starting_price = startingPrice;
      basePayload.bid_increment = bidIncrement;
    }

    if (editingId) {
      const { error } = await supabase
        .from("auction_items")
        .update(basePayload)
        .eq("id", editingId);
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Barang diperbarui");
      await loadItems();
      cancelForm();
    } else {
      const insertPayload = {
        ...basePayload,
        period_id: periodId,
        lot_number: form.lot_number,
        starting_price: canEditPricing ? startingPrice : 0,
        bid_increment: canEditPricing ? bidIncrement : 10000,
        current_price: canEditPricing ? startingPrice : 0,
      };

      const { data, error } = await supabase
        .from("auction_items")
        .insert(insertPayload)
        .select()
        .single();
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Barang ditambahkan — tambahkan foto (maks. 5)");
      await loadItems();
      onItemsChange?.();
      if (data) {
        setAddingNew(false);
        setEditingId(data.id);
        setPhotos([]);
      }
    }
  }

  async function handlePhotoUpload(file: File) {
    if (!editingId) {
      toast.error("Simpan barang terlebih dahulu");
      return;
    }
    if (photos.length >= MAX_PHOTOS) {
      toast.error(`Maksimal ${MAX_PHOTOS} foto`);
      return;
    }

    setUploading(true);

    let uploadFile: File;
    try {
      uploadFile = await compressImageFile(file);
    } catch (error) {
      setUploading(false);
      toast.error(error instanceof Error ? error.message : "Gagal mengompres foto");
      return;
    }

    const path = `${editingId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("auction-photos")
      .upload(path, uploadFile);

    if (uploadError) {
      setUploading(false);
      toast.error(uploadError.message);
      return;
    }

    const { error: dbError } = await supabase.from("item_photos").insert({
      item_id: editingId,
      storage_path: path,
      sort_order: photos.length + 1,
    });

    setUploading(false);

    if (dbError) {
      toast.error(dbError.message);
      return;
    }

    toast.success("Foto berhasil diupload");
    await loadPhotos(editingId);
  }

  async function handlePhotoDelete(photo: ItemPhoto) {
    if (!editingId) return;

    await supabase.storage.from("auction-photos").remove([photo.storage_path]);
    const { error } = await supabase
      .from("item_photos")
      .delete()
      .eq("id", photo.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Foto dihapus");
    await loadPhotos(editingId);
  }

  function requestDeleteItem(item: AuctionItem) {
    setDeleteTarget(item);
  }

  async function confirmDeleteItem() {
    if (!deleteTarget) return;

    setDeleting(true);

    const { count: bidCount, error: bidError } = await supabase
      .from("bids")
      .select("*", { count: "exact", head: true })
      .eq("item_id", deleteTarget.id);

    if (bidError) {
      setDeleting(false);
      toast.error(bidError.message);
      return;
    }

    if ((bidCount ?? 0) > 0) {
      setDeleting(false);
      setDeleteTarget(null);
      toast.error("Barang sudah memiliki penawaran dan tidak dapat dihapus");
      return;
    }

    const { data: itemPhotos } = await supabase
      .from("item_photos")
      .select("storage_path")
      .eq("item_id", deleteTarget.id);

    if (itemPhotos?.length) {
      await supabase.storage
        .from("auction-photos")
        .remove(itemPhotos.map((photo) => photo.storage_path));
    }

    const { error } = await supabase
      .from("auction_items")
      .delete()
      .eq("id", deleteTarget.id);

    setDeleting(false);
    setDeleteTarget(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (editingId === deleteTarget.id) {
      cancelForm();
    }

    toast.success("Barang dihapus");
    await loadItems();
    onItemsChange?.();
  }

  const formProps = {
    form,
    setForm,
    photos,
    editingId,
    loading,
    uploading,
    onSubmit: handleSubmit,
    onCancel: cancelForm,
    onPhotoUpload: handlePhotoUpload,
    onPhotoDelete: handlePhotoDelete,
    canEditPricing,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900">Barang Lelang</h2>
          <p className="text-sm text-slate-500">{items.length} lot dalam periode ini</p>
        </div>
        {!isFormOpen && (
          <Button
            variant="primary"
            size="sm"
            className="w-full shrink-0 whitespace-nowrap sm:w-auto"
            onClick={startAdd}
          >
            <Plus className="h-4 w-4" />
            Tambah Barang
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {items.length === 0 && !addingNew ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">Belum ada barang dalam periode ini.</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4 whitespace-nowrap"
              onClick={startAdd}
            >
              <Plus className="h-4 w-4" />
              Tambah Barang
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) =>
              editingId === item.id ? (
                <ItemForm
                  key={item.id}
                  {...formProps}
                  title={`Edit — ${item.lot_number}`}
                />
              ) : (
                <ItemRow
                  key={item.id}
                  item={item}
                  onEdit={startEdit}
                  onDelete={requestDeleteItem}
                  disabled={isFormOpen}
                />
              )
            )}

            {addingNew && (
              <ItemForm {...formProps} title="Tambah Barang Baru" isNew />
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus Barang"
        message={
          deleteTarget
            ? `Yakin ingin menghapus "${deleteTarget.lot_number} — ${deleteTarget.item_name}"? Tindakan ini tidak dapat dibatalkan.`
            : ""
        }
        confirmLabel="Hapus"
        loading={deleting}
        onConfirm={confirmDeleteItem}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
