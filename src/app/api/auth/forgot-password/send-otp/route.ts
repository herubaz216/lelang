import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetOtpEmail } from "@/lib/email";
import { findAccountByNik, maskEmail } from "@/lib/password-reset";
import {
  canResendOtp,
  generateOtpCode,
  getOtpExpiryDate,
  hashOtp,
  otpConfig,
} from "@/lib/otp";

type SendForgotPasswordOtpBody = {
  employeeNik?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendForgotPasswordOtpBody;
    const employeeNik = body.employeeNik?.trim() ?? "";

    if (!employeeNik) {
      return NextResponse.json({ error: "NIK wajib diisi" }, { status: 400 });
    }

    const account = await findAccountByNik(employeeNik);
    if (!account) {
      return NextResponse.json(
        {
          error:
            "NIK tidak ditemukan atau akun login belum tersedia. Pastikan Anda sudah mendaftar.",
        },
        { status: 404 }
      );
    }

    const admin = createAdminClient();

    const { data: recentOtp } = await admin
      .from("password_reset_otps")
      .select("created_at")
      .eq("employee_nik", account.employeeNik)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOtp && !canResendOtp(recentOtp.created_at)) {
      return NextResponse.json(
        {
          error: `Tunggu ${otpConfig.RESEND_COOLDOWN_SECONDS} detik sebelum kirim ulang OTP`,
        },
        { status: 429 }
      );
    }

    const otp = generateOtpCode();
    const expiresAt = getOtpExpiryDate();

    await admin
      .from("password_reset_otps")
      .delete()
      .eq("employee_nik", account.employeeNik);

    const { error: insertError } = await admin.from("password_reset_otps").insert({
      employee_nik: account.employeeNik,
      email: account.email,
      otp_hash: hashOtp(account.email, otp),
      attempts: 0,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      return NextResponse.json(
        { error: "Gagal menyimpan OTP. Coba lagi." },
        { status: 500 }
      );
    }

    await sendPasswordResetOtpEmail(account.email, account.fullName, otp);

    return NextResponse.json({
      ok: true,
      message: "Kode OTP telah dikirim ke email terdaftar",
      maskedEmail: maskEmail(account.email),
      fullName: account.fullName,
      employeeNik: account.employeeNik,
      expiresInMinutes: otpConfig.OTP_TTL_MINUTES,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal mengirim OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
