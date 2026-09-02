"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearPushSubscribed,
  isPushSubscribed,
  markPushSubscribed,
} from "@/lib/push-prompt-storage";
import {
  canShowPushOptIn,
  getExistingPushSubscription,
  isPushSupported,
  registerServiceWorker,
  urlBase64ToUint8Array,
} from "@/lib/push-client";

async function resolveSubscribedState() {
  if (!isPushSupported()) {
    return isPushSubscribed();
  }

  try {
    await registerServiceWorker();
    const subscription = await getExistingPushSubscription();
    const markedSubscribed = isPushSubscribed();

    if (subscription && markedSubscribed) {
      return true;
    }

    if (markedSubscribed && !subscription) {
      clearPushSubscribed();
    }

    return false;
  } catch {
    if (isPushSubscribed()) {
      clearPushSubscribed();
    }
    return false;
  }
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const refreshState = useCallback(async () => {
    if (!canShowPushOptIn()) {
      setPermission("unsupported");
      setSubscribed(false);
      setReady(true);
      return;
    }

    if (!isPushSupported()) {
      setPermission(
        typeof Notification !== "undefined" ? Notification.permission : "unsupported"
      );
      setSubscribed(await resolveSubscribedState());
      setReady(true);
      return;
    }

    setPermission(Notification.permission);
    setSubscribed(await resolveSubscribedState());
    setReady(true);
  }, []);

  useEffect(() => {
    setReady(false);
    void refreshState();

    const handler = () => void refreshState();
    window.addEventListener("elang-push-state-change", handler);
    window.addEventListener("focus", handler);
    window.addEventListener("pageshow", handler);
    return () => {
      window.removeEventListener("elang-push-state-change", handler);
      window.removeEventListener("focus", handler);
      window.removeEventListener("pageshow", handler);
    };
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

      markPushSubscribed();
      setSubscribed(true);
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  const disableNotifications = useCallback(async () => {
    if (!isPushSupported()) return;

    setLoading(true);

    try {
      const subscription = await getExistingPushSubscription();
      if (!subscription) {
        clearPushSubscribed();
        setSubscribed(false);
        return;
      }

      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      await subscription.unsubscribe();
      clearPushSubscribed();
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const needsOptIn =
    ready && canShowPushOptIn() && permission !== "denied" && permission !== "unsupported" && !subscribed;

  return {
    permission,
    subscribed,
    needsOptIn,
    loading,
    ready,
    enableNotifications,
    disableNotifications,
    refreshState,
  };
}
