import { NextResponse } from "next/server";
import { fetchCompanyByCode } from "@/lib/companies";
import { DEFAULT_COMPANY_CODE } from "@/lib/company-utils";
import { deletePushSubscription } from "@/lib/push-subscriptions";

type UnsubscribeBody = {
  companyCode?: string;
  endpoint?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UnsubscribeBody;
    const companyCode = (body.companyCode ?? DEFAULT_COMPANY_CODE).toLowerCase();
    const endpoint = body.endpoint?.trim();

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint wajib diisi" }, { status: 400 });
    }

    const company = await fetchCompanyByCode(companyCode);
    if (!company) {
      return NextResponse.json({ error: "Perusahaan tidak ditemukan" }, { status: 404 });
    }

    await deletePushSubscription(company.id, endpoint);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menghapus subscription" },
      { status: 500 }
    );
  }
}
