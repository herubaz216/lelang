"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_COMPANY_CODE } from "@/lib/company-utils";
import {
  clearCompanyPushSubscribed,
  isCompanyPushSubscribed,
  markCompanyPushSubscribed,
  markPushPromptSeen,
} from "@/lib/push-prompt-storage";
import {
  getExistingPushSubscription,
  isPushSupported,
  registerServiceWorker,
  urlBase64ToUint8Array,
} from "@/lib/push-client";

export function usePushNotifications(companyCode?: string | null) {
  const resolvedCompanyCode = (companyCode ?? DEFAULT_COMPANY_CODE).toLowerCase();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const refreshState = useCallback(async () => {
    if (!isPushSupported()) {
      setPermission("unsupported");
      setSubscribed(false);
      setReady(true);
      return;
    }

    setPermission(Notification.permission);

    try {
      await registerServiceWorker();
      const subscription = await getExistingPushSubscription();
      const companySubscribed = isCompanyPushSubscribed(resolvedCompanyCode);
      setSubscribed(Boolean(subscription) && companySubscribed);
    } catch {
      setSubscribed(false);
    } finally {
      setReady(true);
    }
  }, [resolvedCompanyCode]);

  useEffect(() => {
    setReady(false);
    void refreshState();

    const handler = () => void refreshState();
    window.addEventListener("elang-push-state-change", handler);
    return () => window.removeEventListener("elang-push-state-change", handler);
  }, [refreshState]);

  const enableNotifications = useCallback(async () => {
    if (!isPushSupported()) return false;

    setLoading(true);

    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID public key belum dikonfigurasi");
      }

      let nextPermission = Notification.permission;
      if (nextPermission === "default") {
        nextPermission = await Notification.requestPermission();
      }
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        markPushPromptSeen(resolvedCompanyCode);
        return false;
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

      markCompanyPushSubscribed(resolvedCompanyCode);
      setSubscribed(true);
      return true;
    } finally {
      setLoading(false);
    }
  }, [resolvedCompanyCode]);

  const disableNotifications = useCallback(async () => {
    if (!isPushSupported()) return;

    setLoading(true);

    try {
      const subscription = await getExistingPushSubscription();
      if (!subscription) {
        clearCompanyPushSubscribed(resolvedCompanyCode);
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

      clearCompanyPushSubscribed(resolvedCompanyCode);
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, [resolvedCompanyCode]);

  return {
    companyCode: resolvedCompanyCode,
    permission,
    subscribed,
    loading,
    ready,
    enableNotifications,
    disableNotifications,
    refreshState,
  };
}
