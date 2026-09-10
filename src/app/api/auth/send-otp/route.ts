import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRegistrationOtpEmail } from "@/lib/email";
import { fetchEmployeeByNik, pickEmployeeMatch } from "@/lib/employee-api";
import {
  isEmployeeNikRegistered,
  resolveCompanyFromPt,
} from "@/lib/employee-registration";
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
  pt?: string;
  companyId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendOtpBody;
    const email = body.email?.trim().toLowerCase() ?? "";
    const employeeNik = body.employeeNik?.trim() ?? "";
    const fullName = body.fullName?.trim() ?? "";
    const pt = body.pt?.trim() ?? "";
    const companyIdInput = body.companyId?.trim() ?? "";

    if (!email || !employeeNik || !fullName) {
      return NextResponse.json(
        { error: "Email, NIK, dan nama wajib diisi" },
        { status: 400 }
      );
    }

    const employee = await fetchEmployeeByNik(employeeNik);
    if (!employee.ok) {
      return NextResponse.json(
        { error: employee.error },
        { status: employee.status ?? 404 }
      );
    }

    if (employee.matches.length > 1 && !pt && !companyIdInput) {
      return NextResponse.json(
        { error: "Pilih perusahaan (PT) terlebih dahulu" },
        { status: 400 }
      );
    }

    const matched = pickEmployeeMatch(employee.matches, { fullName, pt });
    if (!matched || matched.fullName !== fullName) {
      return NextResponse.json(
        { error: "Nama karyawan tidak sesuai data HR untuk PT yang dipilih" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const company =
      (companyIdInput
        ? (
            await admin
              .from("companies")
              .select("*")
              .eq("id", companyIdInput)
              .maybeSingle()
          ).data
        : null) ?? (await resolveCompanyFromPt(matched.pt));

    if (!company) {
      return NextResponse.json(
        {
          error:
            "Perusahaan dari data HR belum terdaftar di E-Lelang. Hubungi admin.",
        },
        { status: 400 }
      );
    }

    const verifiedNik = matched.nomorInduk;

    if (await isEmployeeNikRegistered(verifiedNik, company.id)) {
      return NextResponse.json(
        {
          error:
            "NIK sudah terdaftar di E-Lelang untuk perusahaan ini. Silakan login.",
        },
        { status: 409 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }

    const { data: emailTaken } = await admin.rpc("email_exists", {
      p_email: email,
    });

    if (emailTaken) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
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
      employee_nik: verifiedNik,
      full_name: fullName,
      company_id: company.id,
      pt_name: matched.pt || company.name,
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
