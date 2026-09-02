import { NextResponse } from "next/server";
import { deletePushSubscriptionByEndpoint } from "@/lib/push-subscriptions";

type UnsubscribeBody = {
  endpoint?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UnsubscribeBody;
    const endpoint = body.endpoint?.trim();

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint wajib diisi" }, { status: 400 });
    }

    await deletePushSubscriptionByEndpoint(endpoint);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menghapus subscription" },
      { status: 500 }
    );
  }
}
