import { NextResponse } from "next/server";
import { fetchEmployeeByNik } from "@/lib/employee-api";
import { analyzeEmployeeMatches } from "@/lib/employee-registration";

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

  const analysis = await analyzeEmployeeMatches(result.matches);

  if (analysis.available.length === 0) {
    if (analysis.unmapped.length > 0 && analysis.registered.length === 0) {
      const pts = analysis.unmapped.map((match) => match.pt).join(", ");
      return NextResponse.json(
        {
          error: `Perusahaan dari data HR belum terdaftar di E-Lelang (${pts}). Hubungi admin.`,
          unsupportedPt: true,
          pts: analysis.unmapped.map((match) => match.pt),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          "NIK sudah terdaftar di E-Lelang untuk semua PT terkait. Silakan login.",
        alreadyRegistered: true,
      },
      { status: 409 }
    );
  }

  const primary = analysis.available[0];

  return NextResponse.json({
    ok: true,
    nomorInduk: primary.nomorInduk,
    fullName: primary.fullName,
    pt: primary.pt,
    companyId: primary.companyId,
    companyCode: primary.companyCode,
    matches: analysis.available,
    requiresPtSelection: analysis.available.length > 1,
  });
}
