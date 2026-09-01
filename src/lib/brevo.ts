type BrevoEmailPayload = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
};

type BrevoConfig = {
  apiKey: string;
  from: string;
  fromName: string;
};

export function getBrevoConfig(): BrevoConfig | null {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) return null;

  const from = process.env.BREVO_FROM_EMAIL ?? process.env.SMTP_FROM;
  const fromName =
    process.env.BREVO_FROM_NAME ?? process.env.SMTP_FROM_NAME ?? "E-Lelang";

  if (!from) {
    throw new Error("BREVO_FROM_EMAIL atau SMTP_FROM wajib diisi");
  }

  return { apiKey, from, fromName };
}

export async function sendBrevoEmail({
  to,
  toName,
  subject,
  html,
  text,
}: BrevoEmailPayload) {
  const config = getBrevoConfig();
  if (!config) {
    throw new Error("BREVO_API_KEY belum dikonfigurasi");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": config.apiKey,
    },
    body: JSON.stringify({
      sender: { name: config.fromName, email: config.from },
      to: [{ email: to, name: toName ?? to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string; code?: string };
      detail = body.message ?? body.code ?? detail;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(`Brevo gagal mengirim email: ${detail}`);
  }
}
