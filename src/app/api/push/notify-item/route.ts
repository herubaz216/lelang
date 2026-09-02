import { NextResponse } from "next/server";
import {
  notifyNewAuctionItem,
  parseAuctionItemInsertPayload,
  verifyPushWebhookSecret,
} from "@/lib/push-notify-item";

export async function POST(request: Request) {
  try {
    if (!verifyPushWebhookSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const item = parseAuctionItemInsertPayload(body);

    if (!item) {
      return NextResponse.json({ error: "Payload item tidak valid" }, { status: 400 });
    }

    const result = await notifyNewAuctionItem(item);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengirim push notification" },
      { status: 500 }
    );
  }
}
