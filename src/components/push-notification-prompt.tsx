"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { canShowPushOptIn, isIosDevice, isStandalonePwa } from "@/lib/push-client";
import { cn } from "@/lib/utils";

type PushNotificationPromptProps = {
  variant?: "navbar" | "banner";
  className?: string;
};

export function PushNotificationPrompt({
  variant = "navbar",
  className,
}: PushNotificationPromptProps) {
  const {
    permission,
    subscribed,
    loading,
    ready,
    enableNotifications,
    disableNotifications,
  } = usePushNotifications();

  if (!ready || !canShowPushOptIn()) {
    return null;
  }

  const showIosHint = isIosDevice() && !isStandalonePwa();

  if (variant === "banner") {
    if (permission === "denied") {
      return (
        <div
          className={cn(
            "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900",
            className
          )}
        >
          Notifikasi diblokir browser. Aktifkan izin notifikasi untuk situs ini di pengaturan
          browser.
        </div>
      );
    }

    if (subscribed) {
      return null;
    }

    return (
      <div
        className={cn(
          "rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4",
          className
        )}
      >
        <div className="min-w-0">
          <p className="font-medium text-slate-900">Dapatkan notifikasi lelang</p>
          <p className="mt-1 text-sm text-slate-600">
            Satu kali aktifkan untuk semua perusahaan (AMS & AMV). Kami beri tahu saat lelang
            dimulai, ditutup, atau ada lot baru.
          </p>
          {showIosHint && (
            <p className="mt-2 text-xs text-slate-500">
              Di iPhone, tambahkan situs ke Home Screen lalu buka dari icon aplikasi agar push
              notification bisa aktif.
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="mt-3 w-full shrink-0 sm:mt-0 sm:w-auto"
          disabled={loading}
          onClick={() => void enableNotifications()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          Aktifkan Notifikasi
        </Button>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <span className={cn("text-xs text-slate-400", className)} title="Notifikasi diblokir">
        <BellOff className="h-4 w-4" />
      </span>
    );
  }

  if (subscribed) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("gap-2 text-emerald-700", className)}
        disabled={loading}
        onClick={() => void disableNotifications()}
        title="Notifikasi aktif untuk semua perusahaan"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
        <span className="hidden sm:inline">Notifikasi aktif</span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("gap-2", className)}
      disabled={loading}
      onClick={() => void enableNotifications()}
      title={showIosHint ? "Di iPhone, gunakan Add to Home Screen terlebih dahulu" : undefined}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
      <span className="hidden sm:inline">Notifikasi</span>
    </Button>
  );
}
