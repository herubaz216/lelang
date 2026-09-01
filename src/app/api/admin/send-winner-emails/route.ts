import { NextResponse } from "next/server";
import { requireStaffApi } from "@/lib/api-auth";
import { sendWinnerEmailsForPeriod } from "@/lib/winner-emails";

type SendWinnerEmailsBody = {
  periodId?: string;
  force?: boolean;
};

export async function POST(request: Request) {
  try {
    const auth = await requireStaffApi();
    if ("error" in auth) return auth.error;

    const body = (await request.json()) as SendWinnerEmailsBody;
    const periodId = body.periodId?.trim();

    if (!periodId) {
      return NextResponse.json({ error: "periodId wajib diisi" }, { status: 400 });
    }

    const result = await sendWinnerEmailsForPeriod(periodId, {
      force: body.force === true,
    });

    if (result.alreadySent) {
      return NextResponse.json({
        ok: true,
        alreadySent: true,
        message: "Email pemenang sudah pernah dikirim untuk periode ini",
      });
    }

    return NextResponse.json({
      ok: true,
      sent: result.sent,
      totalWinners: result.totalWinners,
      skippedNoEmail: result.skippedNoEmail,
      message:
        result.sent > 0
          ? `Email berhasil dikirim ke ${result.sent} pemenang`
          : "Tidak ada pemenang dengan email terdaftar",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal mengirim email pemenang";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
