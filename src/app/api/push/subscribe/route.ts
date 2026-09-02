import { NextResponse } from "next/server";
import { upsertPushSubscriptionForAllCompanies } from "@/lib/push-subscriptions";

type SubscribeBody = {
  subscription?: {
    endpoint?: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubscribeBody;
    const endpoint = body.subscription?.endpoint?.trim();
    const p256dh = body.subscription?.keys?.p256dh?.trim();
    const auth = body.subscription?.keys?.auth?.trim();

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: "Data subscription tidak lengkap" },
        { status: 400 }
      );
    }

    const companyCount = await upsertPushSubscriptionForAllCompanies({
      endpoint,
      p256dh,
      auth,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true, companyCount });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menyimpan subscription" },
      { status: 500 }
    );
  }
}
