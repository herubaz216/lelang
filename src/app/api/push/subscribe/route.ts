import { NextResponse } from "next/server";
import { fetchCompanyByCode } from "@/lib/companies";
import { DEFAULT_COMPANY_CODE } from "@/lib/company-utils";
import { upsertPushSubscription } from "@/lib/push-subscriptions";

type SubscribeBody = {
  companyCode?: string;
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
    const companyCode = (body.companyCode ?? DEFAULT_COMPANY_CODE).toLowerCase();
    const endpoint = body.subscription?.endpoint?.trim();
    const p256dh = body.subscription?.keys?.p256dh?.trim();
    const auth = body.subscription?.keys?.auth?.trim();

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: "Data subscription tidak lengkap" },
        { status: 400 }
      );
    }

    const company = await fetchCompanyByCode(companyCode);
    if (!company) {
      return NextResponse.json({ error: "Perusahaan tidak ditemukan" }, { status: 404 });
    }

    await upsertPushSubscription(company.id, {
      endpoint,
      p256dh,
      auth,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menyimpan subscription" },
      { status: 500 }
    );
  }
}
