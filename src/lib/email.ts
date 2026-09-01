import nodemailer from "nodemailer";
import { formatRupiah } from "@/lib/format";
import { getBrevoConfig, sendBrevoEmail } from "@/lib/brevo";

type EmailPayload = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
};

async function sendEmail(payload: EmailPayload) {
  const brevo = getBrevoConfig();
  if (brevo) {
    await sendBrevoEmail(payload);
    return;
  }

  const { from, fromName } = getSmtpConfig();
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${fromName}" <${from}>`,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
  await sendEmail({
    to,
    toName: fullName,
    subject: "Kode OTP Pendaftaran E-Lelang",
    html: buildOtpEmailHtml(fullName, otp),
    text: `Halo ${fullName},\n\nKode OTP pendaftaran E-Lelang Anda: ${otp}\n\nKode berlaku 10 menit. Jangan bagikan kepada siapa pun.`,
  });
}

type WinnerEmailItem = {
  lotNumber: string;
  itemName: string;
  price: number;
};

type WinnerBankAccount = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  notes: string | null;
};

function buildWinnerEmailHtml({
  recipientName,
  companyShortName,
  companyName,
  periodCode,
  periodTitle,
  items,
  totalAmount,
  bankAccounts,
}: {
  recipientName: string;
  companyShortName: string;
  companyName: string;
  periodCode: string;
  periodTitle: string;
  items: WinnerEmailItem[];
  totalAmount: number;
  bankAccounts: WinnerBankAccount[];
}) {
  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:13px;color:#4f46e5;">${escapeHtml(item.lotNumber)}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;">${escapeHtml(item.itemName)}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;text-align:right;white-space:nowrap;">${escapeHtml(formatRupiah(item.price))}</td>
        </tr>`
    )
    .join("");

  const bankBlocks =
    bankAccounts.length > 0
      ? bankAccounts
          .map(
            (account) => `
              <div style="margin-top:12px;padding:14px 16px;border:1px solid #bbf7d0;border-radius:12px;background:#f0fdf4;">
                <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#166534;">${escapeHtml(account.bankName)}</p>
                <p style="margin:8px 0 0;font-family:monospace;font-size:16px;font-weight:700;color:#14532d;">${escapeHtml(account.accountNumber)}</p>
                <p style="margin:6px 0 0;font-size:14px;color:#166534;">a.n. ${escapeHtml(account.accountHolder)}</p>
                ${account.notes ? `<p style="margin:6px 0 0;font-size:13px;color:#4b5563;">${escapeHtml(account.notes)}</p>` : ""}
              </div>`
          )
          .join("")
      : `<p style="margin:0;font-size:14px;color:#64748b;">Informasi rekening pembayaran akan diinformasikan lebih lanjut.</p>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Selamat! Anda Memenangkan Lelang</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#4f46e5;padding:24px 28px;">
              <p style="margin:0;font-size:13px;color:#c7d2fe;letter-spacing:0.08em;text-transform:uppercase;">E-Lelang &bull; ${escapeHtml(companyShortName)}</p>
              <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;color:#ffffff;">Selamat, Anda Memenangkan Lelang!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;">
                Halo <strong>${escapeHtml(recipientName)}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
                Lelang <strong>${escapeHtml(companyName)}</strong> periode <strong>${escapeHtml(periodCode)}</strong> — ${escapeHtml(periodTitle)} telah ditutup.
                Berikut barang yang Anda menangkan:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th align="left" style="padding:12px 14px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">Lot</th>
                    <th align="left" style="padding:12px 14px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">Barang</th>
                    <th align="right" style="padding:12px 14px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">Harga</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
                <tfoot>
                  <tr style="background:#f8fafc;">
                    <td colspan="2" style="padding:14px;font-size:14px;font-weight:700;color:#0f172a;">Total Pembayaran</td>
                    <td style="padding:14px;font-size:16px;font-weight:700;color:#047857;text-align:right;white-space:nowrap;">${escapeHtml(formatRupiah(totalAmount))}</td>
                  </tr>
                </tfoot>
              </table>

              <div style="margin-top:28px;padding-top:24px;border-top:1px solid #e2e8f0;">
                <h2 style="margin:0 0 8px;font-size:16px;color:#0f172a;">Informasi Pembayaran ${escapeHtml(companyShortName)}</h2>
                <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#475569;">
                  Silakan transfer sesuai total di atas ke rekening ${escapeHtml(companyShortName)} berikut:
                </p>
                ${bankBlocks}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                Email otomatis dari E-Lelang &bull; ${escapeHtml(companyName)}
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

export async function sendWinnerNotificationEmail({
  to,
  recipientName,
  companyShortName,
  companyName,
  periodCode,
  periodTitle,
  items,
  totalAmount,
  bankAccounts,
}: {
  to: string;
  recipientName: string;
  companyShortName: string;
  companyName: string;
  periodCode: string;
  periodTitle: string;
  items: WinnerEmailItem[];
  totalAmount: number;
  bankAccounts: WinnerBankAccount[];
}) {
  const itemLines = items
    .map(
      (item) =>
        `- ${item.lotNumber} | ${item.itemName} | ${formatRupiah(item.price)}`
    )
    .join("\n");

  const bankLines =
    bankAccounts.length > 0
      ? bankAccounts
          .map(
            (account) =>
              `${account.bankName} — ${account.accountNumber} a.n. ${account.accountHolder}${account.notes ? ` (${account.notes})` : ""}`
          )
          .join("\n")
      : "Informasi rekening akan diinformasikan lebih lanjut.";

  await sendEmail({
    to,
    toName: recipientName,
    subject: `[${companyShortName}] Selamat! Anda Memenangkan Lelang ${periodCode}`,
    html: buildWinnerEmailHtml({
      recipientName,
      companyShortName,
      companyName,
      periodCode,
      periodTitle,
      items,
      totalAmount,
      bankAccounts,
    }),
    text: `Halo ${recipientName},\n\nLelang ${companyName} periode ${periodCode} — ${periodTitle} telah ditutup.\n\nBarang yang Anda menangkan:\n${itemLines}\n\nTotal pembayaran: ${formatRupiah(totalAmount)}\n\nSilakan transfer ke rekening ${companyShortName}:\n${bankLines}`,
  });
}
