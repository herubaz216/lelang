import { createAdminClient } from "@/lib/supabase/admin";
import { withCompanyQuery } from "@/lib/company-utils";
import {
  deletePushSubscriptionByEndpoint,
  fetchPushSubscriptionsByCompany,
} from "@/lib/push-subscriptions";
import {
  isExpiredPushSubscriptionError,
  sendPushNotification,
} from "@/lib/web-push";
import type { AuctionItem } from "@/lib/database.types";

const NOTIFYABLE_ITEM_STATUSES = new Set(["active", "ready"]);

export type AuctionItemInsertRecord = Pick<
  AuctionItem,
  "id" | "period_id" | "lot_number" | "item_name" | "status"
>;

export function verifyPushWebhookSecret(request: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("PUSH_WEBHOOK_SECRET belum dikonfigurasi");
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const headerSecret = request.headers.get("x-webhook-secret");

  if (bearerToken !== secret && headerSecret !== secret) {
    return false;
  }

  return true;
}

export function parseAuctionItemInsertPayload(body: unknown): AuctionItemInsertRecord | null {
  if (!body || typeof body !== "object") return null;

  const payload = body as Record<string, unknown>;
  const record =
    payload.record && typeof payload.record === "object"
      ? (payload.record as Record<string, unknown>)
      : payload;

  const id = typeof record.id === "string" ? record.id : null;
  const periodId = typeof record.period_id === "string" ? record.period_id : null;
  const lotNumber = typeof record.lot_number === "string" ? record.lot_number : null;
  const itemName = typeof record.item_name === "string" ? record.item_name : null;
  const status = typeof record.status === "string" ? record.status : null;

  if (!id || !periodId || !lotNumber || !itemName || !status) {
    return null;
  }

  return {
    id,
    period_id: periodId,
    lot_number: lotNumber,
    item_name: itemName,
    status,
  };
}

export async function notifyNewAuctionItem(item: AuctionItemInsertRecord) {
  if (!NOTIFYABLE_ITEM_STATUSES.has(item.status)) {
    return { sent: 0, skipped: true, reason: "item_not_public" as const };
  }

  const admin = createAdminClient();
  const { data: period, error: periodError } = await admin
    .from("auction_periods")
    .select("id, status, company_id")
    .eq("id", item.period_id)
    .maybeSingle();

  if (periodError) {
    throw new Error(periodError.message);
  }

  if (!period || period.status !== "active") {
    return { sent: 0, skipped: true, reason: "period_not_active" as const };
  }

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("code")
    .eq("id", period.company_id)
    .maybeSingle();

  if (companyError) {
    throw new Error(companyError.message);
  }

  const companyCode = company?.code ?? "ams";
  const subscriptions = await fetchPushSubscriptionsByCompany(period.company_id);

  if (subscriptions.length === 0) {
    return { sent: 0, skipped: true, reason: "no_subscribers" as const };
  }

  const targetUrl = withCompanyQuery(`/lots/${item.id}`, companyCode);
  let sent = 0;

  for (const subscription of subscriptions) {
    try {
      await sendPushNotification(
        {
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
        {
          title: `Barang baru: ${item.lot_number}`,
          body: item.item_name,
          url: targetUrl,
        }
      );
      sent += 1;
    } catch (error) {
      if (isExpiredPushSubscriptionError(error)) {
        await deletePushSubscriptionByEndpoint(subscription.endpoint);
      }
    }
  }

  return { sent, skipped: false as const };
}
