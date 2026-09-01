import { NextResponse } from "next/server";
import { fetchEmployeeByNik } from "@/lib/employee-api";
import { isEmployeeNikRegistered } from "@/lib/employee-registration";

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

  const alreadyRegistered = await isEmployeeNikRegistered(result.nomorInduk);
  if (alreadyRegistered) {
    return NextResponse.json(
      {
        error: "NIK sudah terdaftar di E-Lelang. Silakan login.",
        alreadyRegistered: true,
      },
      { status: 409 }
    );
  }

  return NextResponse.json({
    ok: true,
    nomorInduk: result.nomorInduk,
    fullName: result.fullName,
  });
}
