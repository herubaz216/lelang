import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim();
  if (!process.env[key]) process.env[key] = value;
}

const apiKey = process.env.BREVO_API_KEY;
const from = process.env.BREVO_FROM_EMAIL;
const fromName = process.env.BREVO_FROM_NAME ?? "E-Lelang";
const to = process.argv[2] ?? "herubaskoro2@gmail.com";

if (!apiKey || !from) {
  console.error("BREVO_API_KEY atau BREVO_FROM_EMAIL belum diisi di .env.local");
  process.exit(1);
}

const otp = "123456";

const html = `<p>Halo <strong>Test User</strong>,</p>
<p>Ini email uji Brevo dari E-Lelang.</p>
<p>Kode OTP contoh: <strong style="font-size:24px;letter-spacing:4px;">${otp}</strong></p>
<p>Jika email ini sampai, konfigurasi Brevo sudah benar.</p>`;

const response = await fetch("https://api.brevo.com/v3/smtp/email", {
  method: "POST",
  headers: {
    accept: "application/json",
    "content-type": "application/json",
    "api-key": apiKey,
  },
  body: JSON.stringify({
    sender: { name: fromName, email: from },
    to: [{ email: to, name: "Heru Baskoro" }],
    subject: "[TEST] Kode OTP Pendaftaran E-Lelang",
    htmlContent: html,
    textContent: `Halo Test User,\n\nIni email uji Brevo dari E-Lelang.\nKode OTP contoh: ${otp}`,
  }),
});

const body = await response.text();
let parsed;
try {
  parsed = JSON.parse(body);
} catch {
  parsed = body;
}

if (!response.ok) {
  console.error("GAGAL:", response.status, parsed);
  process.exit(1);
}

console.log("BERHASIL! Email test dikirim ke:", to);
console.log("Response:", parsed);
console.log("From:", `${fromName} <${from}>`);
