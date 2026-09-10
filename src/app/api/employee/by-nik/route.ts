import { NextResponse } from "next/server";
import { fetchEmployeeByNik } from "@/lib/employee-api";
import { filterUnregisteredEmployeeMatches } from "@/lib/employee-registration";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nomorInduk =
    searchParams.get("nomor_induk")?.trim() ||
    searchParams.get("nik")?.trim() ||
    "";

  if (!nomorInduk) {
    return NextResponse.json(
      { error: "Parameter nomor_induk wajib diisi" },
      { status: 400 }
    );
  }

  const result = await fetchEmployeeByNik(nomorInduk);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 404 }
    );
  }

  const availableMatches = await filterUnregisteredEmployeeMatches(
    result.matches
  );

  if (availableMatches.length === 0) {
    return NextResponse.json(
      {
        error: "NIK sudah terdaftar di E-Lelang untuk semua PT terkait. Silakan login.",
        alreadyRegistered: true,
      },
      { status: 409 }
    );
  }

  const primary = availableMatches[0];

  return NextResponse.json({
    ok: true,
    nomorInduk: primary.nomorInduk,
    fullName: primary.fullName,
    pt: primary.pt,
    companyId: primary.companyId,
    companyCode: primary.companyCode,
    matches: availableMatches,
    requiresPtSelection: availableMatches.length > 1,
  });
}
