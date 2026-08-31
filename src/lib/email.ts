import nodemailer from "nodemailer";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;
  const fromName = process.env.SMTP_FROM_NAME ?? "E-Lelang";

  if (!host || !user || !pass || !from) {
    throw new Error("Konfigurasi SMTP belum lengkap");
  }

  return { host, port, user, pass, from, fromName };
}

function createTransporter() {
  const { host, port, user, pass } = getSmtpConfig();
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function buildOtpEmailHtml(fullName: string, otp: string) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kode Verifikasi E-Lelang</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#4f46e5;padding:24px 28px;">
              <p style="margin:0;font-size:13px;color:#c7d2fe;letter-spacing:0.08em;text-transform:uppercase;">E-Lelang</p>
              <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;color:#ffffff;">Verifikasi Email</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;">
                Halo <strong>${fullName}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
                Gunakan kode OTP berikut untuk menyelesaikan pendaftaran akun bidder Anda.
              </p>
              <div style="text-align:center;margin:24px 0;">
                <div style="display:inline-block;padding:16px 28px;border-radius:12px;background:#eef2ff;border:1px dashed #818cf8;">
                  <span style="font-size:32px;font-weight:700;letter-spacing:0.35em;color:#312e81;">${otp}</span>
                </div>
              </div>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#64748b;">
                Kode berlaku selama <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapa pun.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#94a3b8;">
                Jika Anda tidak meminta kode ini, abaikan email ini.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                Email otomatis dari E-Lelang &bull; AMS Group
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendRegistrationOtpEmail(
  to: string,
  fullName: string,
  otp: string
) {
  const { from, fromName } = getSmtpConfig();
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"${fromName}" <${from}>`,
    to,
    subject: "Kode OTP Pendaftaran E-Lelang",
    html: buildOtpEmailHtml(fullName, otp),
    text: `Halo ${fullName},\n\nKode OTP pendaftaran E-Lelang Anda: ${otp}\n\nKode berlaku 10 menit. Jangan bagikan kepada siapa pun.`,
  });
}
