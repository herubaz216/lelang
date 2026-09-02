import webpush from "web-push";

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  icon?: string;
};

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@amscorp.id";

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys belum dikonfigurasi");
  }

  return { publicKey, privateKey, subject };
}

export function configureWebPush() {
  const { publicKey, privateKey, subject } = getVapidConfig();
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return webpush;
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
}

export async function sendPushNotification(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: PushPayload
) {
  const push = configureWebPush();

  await push.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url,
      icon: payload.icon ?? "/icons/icon-192.svg",
    })
  );
}

export function isExpiredPushSubscriptionError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const statusCode = "statusCode" in error ? Number(error.statusCode) : 0;
  return statusCode === 404 || statusCode === 410;
}
