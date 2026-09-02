import { verifyPushWebhookSecret } from "@/lib/push-notify-shared";
import {
  notifyAuctionPeriodInsert,
  notifyAuctionPeriodUpdate,
  parsePeriodInsertPayload,
  parsePeriodUpdatePayload,
} from "@/lib/push-notify-period";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    if (!verifyPushWebhookSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const eventType =
      body && typeof body === "object" && typeof body.type === "string"
        ? body.type
        : null;

    if (eventType === "INSERT") {
      const record = parsePeriodInsertPayload(body);
      if (!record) {
        return NextResponse.json({ error: "Payload periode tidak valid" }, { status: 400 });
      }

      const result = await notifyAuctionPeriodInsert(record);
      return NextResponse.json({ ok: true, event: "insert", ...result });
    }

    const updatePayload = parsePeriodUpdatePayload(body);
    if (!updatePayload) {
      return NextResponse.json({ error: "Payload periode tidak valid" }, { status: 400 });
    }

    const result = await notifyAuctionPeriodUpdate(
      updatePayload.record,
      updatePayload.oldRecord
    );
    return NextResponse.json({ ok: true, event: "update", ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Gagal mengirim push notifikasi periode",
      },
      { status: 500 }
    );
  }
}
