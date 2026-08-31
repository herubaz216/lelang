import { NextRequest, NextResponse } from "next/server";
import { fetchItemsPage, PAGE_SIZE } from "@/lib/items";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const offset = Number(searchParams.get("offset") ?? "0");
  const limit = Number(searchParams.get("limit") ?? String(PAGE_SIZE));
  const category = searchParams.get("category");
  const periodId = searchParams.get("period_id") ?? undefined;

  const result = await fetchItemsPage({
    periodId,
    category,
    offset,
    limit,
  });

  return NextResponse.json(result);
}
