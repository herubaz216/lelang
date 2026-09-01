import { NextResponse } from "next/server";
import { requireAmsStaffApi } from "@/lib/api-auth";
import { fetchRegisteredUsers } from "@/lib/admin-users";
import { DEFAULT_PAGE_SIZE } from "@/components/ui/pagination";

export async function GET(request: Request) {
  try {
    const auth = await requireAmsStaffApi();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE)
    );
    const search = searchParams.get("q")?.trim() ?? "";

    const { users, total } = await fetchRegisteredUsers({ page, pageSize, search });

    return NextResponse.json({ users, total, page, pageSize });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal memuat daftar user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
