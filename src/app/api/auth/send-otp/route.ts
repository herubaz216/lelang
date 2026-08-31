import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRegistrationOtpEmail } from "@/lib/email";
import {
  canResendOtp,
  generateOtpCode,
  getOtpExpiryDate,
  hashOtp,
  otpConfig,
} from "@/lib/otp";

type SendOtpBody = {
  email?: string;
  employeeNik?: string;
  fullName?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendOtpBody;
    const email = body.email?.trim().toLowerCase() ?? "";
    const employeeNik = body.employeeNik?.trim() ?? "";
    const fullName = body.fullName?.trim() ?? "";

    if (!email || !employeeNik || !fullName) {
      return NextResponse.json(
        { error: "Email, NIK, dan nama wajib diisi" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: emailTaken } = await admin.rpc("email_exists", {
      p_email: email,
    });

    if (emailTaken) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("employee_nik", employeeNik)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: "NIK sudah terdaftar" },
        { status: 409 }
      );
    }

    const { data: recentOtp } = await admin
      .from("registration_otps")
      .select("created_at")
      .eq("email", email)
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

    await admin.from("registration_otps").delete().eq("email", email);

    const { error: insertError } = await admin.from("registration_otps").insert({
      email,
      otp_hash: hashOtp(email, otp),
      employee_nik: employeeNik,
      full_name: fullName,
      attempts: 0,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      return NextResponse.json(
        { error: "Gagal menyimpan OTP. Coba lagi." },
        { status: 500 }
      );
    }

    await sendRegistrationOtpEmail(email, fullName, otp);

    return NextResponse.json({
      ok: true,
      message: "Kode OTP telah dikirim ke email Anda",
      expiresInMinutes: otpConfig.OTP_TTL_MINUTES,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal mengirim OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
