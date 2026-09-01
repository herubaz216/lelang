"use client";

import { useState } from "react";
import { AuctionPeriod } from "@/lib/database.types";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Mail, CheckCircle2 } from "lucide-react";

export function PeriodWinnerEmailBar({
  period,
  onSent,
}: {
  period: AuctionPeriod;
  onSent?: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [confirmResend, setConfirmResend] = useState(false);

  if (period.status !== "finished") return null;

  async function sendEmails(force = false) {
    setSending(true);
    try {
      const response = await fetch("/api/admin/send-winner-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId: period.id, force }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Gagal mengirim email");
        return;
      }

      if (data.alreadySent) {
        toast.info(data.message);
        return;
      }

      if (data.skippedNoEmail > 0) {
        toast.success(
          `${data.message}. ${data.skippedNoEmail} pemenang tanpa email dilewati.`
        );
      } else {
        toast.success(data.message);
      }

      onSent?.();
    } catch {
      toast.error("Gagal mengirim email pemenang");
    } finally {
      setSending(false);
      setConfirmResend(false);
    }
  }

  return (
    <>
      <div className="border-b border-[var(--border)] bg-amber-50/60 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Notifikasi Pemenang</p>
            {period.winner_emails_sent_at ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Email terkirim {formatDateTime(period.winner_emails_sent_at)}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-slate-600">
                Kirim email ke pemenang berisi daftar barang, total bayar, dan rekening.
              </p>
            )}
          </div>
          <Button
            variant={period.winner_emails_sent_at ? "outline" : "primary"}
            size="sm"
            className="w-full shrink-0 sm:w-auto"
            disabled={sending}
            onClick={() => {
              if (period.winner_emails_sent_at) {
                setConfirmResend(true);
              } else {
                void sendEmails(false);
              }
            }}
          >
            <Mail className="h-4 w-4" />
            {sending
              ? "Mengirim..."
              : period.winner_emails_sent_at
                ? "Kirim Ulang Email"
                : "Kirim Email Pemenang"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmResend}
        title="Kirim Ulang Email Pemenang"
        message="Email sudah pernah dikirim untuk periode ini. Kirim ulang ke semua pemenang?"
        confirmLabel="Kirim Ulang"
        loading={sending}
        destructive={false}
        onConfirm={() => sendEmails(true)}
        onCancel={() => !sending && setConfirmResend(false)}
      />
    </>
  );
}
