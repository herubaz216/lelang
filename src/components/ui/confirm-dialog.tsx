"use client";

import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  loading = false,
  destructive = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup dialog"
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl"
      >
        <h3 id="confirm-dialog-title" className="text-lg font-semibold text-slate-900">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Memproses..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
