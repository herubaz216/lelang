"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import {
  isIosDevice,
  isPushSupported,
  isStandalonePwa,
} from "@/lib/push-client";
import {
  markPushPromptSeen,
  shouldAutoPromptPush,
} from "@/lib/push-prompt-storage";

export function PushNotificationAutoPrompt() {
  const {
    permission,
    subscribed,
    loading,
    ready,
    enableNotifications,
  } = usePushNotifications();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready || !isPushSupported()) return;
    if (permission === "denied" || subscribed) return;
    if (!shouldAutoPromptPush()) return;

    const timer = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(timer);
  }, [ready, permission, subscribed]);

  function dismiss() {
    markPushPromptSeen();
    setOpen(false);
  }

  async function handleEnable() {
    await enableNotifications();
    setOpen(false);
  }

  if (!open || permission === "unsupported") {
    return null;
  }

  const showIosHint = isIosDevice() && !isStandalonePwa();

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-auto-prompt-title"
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <Bell className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 id="push-auto-prompt-title" className="mt-4 text-lg font-semibold text-slate-900">
          Aktifkan notifikasi lelang?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Satu kali aktifkan untuk semua perusahaan (<strong>AMS</strong> & <strong>AMV</strong>).
          Dapatkan pemberitahuan saat lelang dimulai, ditutup, atau ada barang baru.
        </p>

        {showIosHint && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Di iPhone, tambahkan situs ke Home Screen lalu buka dari icon aplikasi agar notifikasi
            bisa aktif.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={dismiss}>
            Nanti saja
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={loading}
            onClick={() => void handleEnable()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            Aktifkan Notifikasi
          </Button>
        </div>
      </div>
    </div>
  );
}
