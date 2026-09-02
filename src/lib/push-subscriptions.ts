import { createAdminClient } from "@/lib/supabase/admin";
import type { PushSubscription } from "@/lib/database.types";

export type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
};

export async function upsertPushSubscription(
  companyId: string,
  subscription: PushSubscriptionInput
) {
  const admin = createAdminClient();

  const { error } = await admin.from("push_subscriptions").upsert(
    {
      company_id: companyId,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      user_agent: subscription.userAgent ?? null,
    },
    { onConflict: "endpoint,company_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function deletePushSubscription(
  companyId: string,
  endpoint: string
) {
  const admin = createAdminClient();

  const { error } = await admin
    .from("push_subscriptions")
    .delete()
    .eq("company_id", companyId)
    .eq("endpoint", endpoint);

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchPushSubscriptionsByCompany(
  companyId: string
): Promise<PushSubscription[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("company_id", companyId);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function deletePushSubscriptionByEndpoint(endpoint: string) {
  const admin = createAdminClient();

  const { error } = await admin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    throw new Error(error.message);
  }
}
