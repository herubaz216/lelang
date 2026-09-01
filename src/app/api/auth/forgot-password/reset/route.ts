import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAccountByNik } from "@/lib/password-reset";
import { hashOtp, isOtpExpired, otpConfig } from "@/lib/otp";

type ResetPasswordBody = {
  employeeNik?: string;
  otp?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResetPasswordBody;
    const employeeNik = body.employeeNik?.trim() ?? "";
    const otp = body.otp?.trim() ?? "";
    const password = body.password ?? "";

    if (!employeeNik || !otp || !password) {
      return NextResponse.json(
        { error: "NIK, OTP, dan password baru wajib diisi" },
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

    const account = await findAccountByNik(employeeNik);
    if (!account) {
      return NextResponse.json(
        { error: "NIK tidak ditemukan atau akun login belum tersedia" },
        { status: 404 }
      );
    }

    const admin = createAdminClient();

    const { data: otpRecord, error: otpError } = await admin
      .from("password_reset_otps")
      .select("*")
      .eq("employee_nik", account.employeeNik)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: "OTP tidak ditemukan. Silakan kirim ulang." },
        { status: 400 }
      );
    }

    if (otpRecord.email !== account.email) {
      return NextResponse.json(
        { error: "Data reset password tidak valid" },
        { status: 400 }
      );
    }

    if (isOtpExpired(otpRecord.expires_at)) {
      await admin.from("password_reset_otps").delete().eq("id", otpRecord.id);
      return NextResponse.json(
        { error: "OTP sudah kedaluwarsa. Silakan kirim ulang." },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= otpConfig.MAX_ATTEMPTS) {
      await admin.from("password_reset_otps").delete().eq("id", otpRecord.id);
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Silakan kirim ulang OTP." },
        { status: 429 }
      );
    }

    const otpValid = otpRecord.otp_hash === hashOtp(account.email, otp);
    if (!otpValid) {
      await admin
        .from("password_reset_otps")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);

      return NextResponse.json({ error: "Kode OTP salah" }, { status: 400 });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(
      account.userId,
      { password }
    );

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Gagal mengubah password" },
        { status: 400 }
      );
    }

    await admin.from("password_reset_otps").delete().eq("id", otpRecord.id);

    return NextResponse.json({
      ok: true,
      message: "Password berhasil diperbarui. Silakan login.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal reset password";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
