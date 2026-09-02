"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_COMPANY_CODE } from "@/lib/company-utils";
import {
  getExistingPushSubscription,
  isIosDevice,
  isPushSupported,
  isStandalonePwa,
  registerServiceWorker,
  urlBase64ToUint8Array,
} from "@/lib/push-client";
import { cn } from "@/lib/utils";

type PermissionState = NotificationPermission | "unsupported";

type PushNotificationPromptProps = {
  companyCode?: string | null;
  variant?: "navbar" | "banner";
  className?: string;
};

export function PushNotificationPrompt({
  companyCode,
  variant = "navbar",
  className,
}: PushNotificationPromptProps) {
  const resolvedCompanyCode = (companyCode ?? DEFAULT_COMPANY_CODE).toLowerCase();
  const [permission, setPermission] = useState<PermissionState>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const refreshState = useCallback(async () => {
    if (!isPushSupported()) {
      setPermission("unsupported");
      setSubscribed(false);
      return;
    }

    setPermission(Notification.permission);

    try {
      await registerServiceWorker();
      const subscription = await getExistingPushSubscription();
      setSubscribed(Boolean(subscription));
    } catch {
      setSubscribed(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    void refreshState();
  }, [refreshState]);

  async function enableNotifications() {
    if (!isPushSupported()) return;

    setLoading(true);

    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID public key belum dikonfigurasi");
      }

      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        return;
      }

      const registration = await registerServiceWorker();
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Subscription push tidak valid");
      }

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyCode: resolvedCompanyCode,
          subscription: {
            endpoint: json.endpoint,
            keys: {
              p256dh: json.keys.p256dh,
              auth: json.keys.auth,
            },
          },
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Gagal mengaktifkan notifikasi");
      }

      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  }

  async function disableNotifications() {
    if (!isPushSupported()) return;

    setLoading(true);

    try {
      const subscription = await getExistingPushSubscription();
      if (!subscription) {
        setSubscribed(false);
        return;
      }

      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyCode: resolvedCompanyCode,
          endpoint: subscription.endpoint,
        }),
      });

      await subscription.unsubscribe();
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted || permission === "unsupported") {
    return null;
  }

  const showIosHint = isIosDevice() && !isStandalonePwa();
  const companyLabel = resolvedCompanyCode.toUpperCase();

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
          <p className="font-medium text-slate-900">Dapatkan notifikasi barang baru</p>
          <p className="mt-1 text-sm text-slate-600">
            Kami akan memberi tahu saat ada lot baru di periode aktif {companyLabel}.
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
        title={`Notifikasi ${companyLabel} aktif`}
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
