import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmployeeNikRegistered } from "@/lib/employee-registration";
import { hashOtp, isOtpExpired, otpConfig } from "@/lib/otp";

type RegisterBody = {
  email?: string;
  otp?: string;
  password?: string;
  employeeNik?: string;
  fullName?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const email = body.email?.trim().toLowerCase() ?? "";
    const otp = body.otp?.trim() ?? "";
    const password = body.password ?? "";
    const employeeNik = body.employeeNik?.trim() ?? "";
    const fullName = body.fullName?.trim() ?? "";

    if (!email || !otp || !password || !employeeNik || !fullName) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "OTP harus 6 digit angka" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: otpRecord, error: otpError } = await admin
      .from("registration_otps")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: "OTP tidak ditemukan. Silakan kirim ulang." },
        { status: 400 }
      );
    }

    if (isOtpExpired(otpRecord.expires_at)) {
      await admin.from("registration_otps").delete().eq("id", otpRecord.id);
      return NextResponse.json(
        { error: "OTP sudah kedaluwarsa. Silakan kirim ulang." },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= otpConfig.MAX_ATTEMPTS) {
      await admin.from("registration_otps").delete().eq("id", otpRecord.id);
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Silakan kirim ulang OTP." },
        { status: 429 }
      );
    }

    if (
      otpRecord.employee_nik !== employeeNik ||
      otpRecord.full_name !== fullName
    ) {
      return NextResponse.json(
        { error: "Data registrasi tidak sesuai dengan OTP" },
        { status: 400 }
      );
    }

    const otpValid = otpRecord.otp_hash === hashOtp(email, otp);

    if (!otpValid) {
      await admin
        .from("registration_otps")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);

      return NextResponse.json({ error: "Kode OTP salah" }, { status: 400 });
    }

    if (await isEmployeeNikRegistered(employeeNik)) {
      return NextResponse.json(
        { error: "NIK sudah terdaftar di E-Lelang. Silakan login." },
        { status: 409 }
      );
    }

    const { error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: fullName,
          full_name: fullName,
          employee_nik: employeeNik,
          username: employeeNik.toLowerCase(),
          role: "bidder",
        },
      });

    if (createError) {
      if (createError.message.toLowerCase().includes("already")) {
        return NextResponse.json(
          { error: "Email sudah terdaftar" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    await admin.from("registration_otps").delete().eq("id", otpRecord.id);

    return NextResponse.json({
      ok: true,
      message: "Registrasi berhasil. Silakan login.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registrasi gagal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
