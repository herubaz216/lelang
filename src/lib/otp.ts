import { createHash, randomInt } from "crypto";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

function getOtpSecret() {
  return (
    process.env.OTP_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "e-lelang-otp-fallback"
  );
}

export function generateOtpCode() {
  return String(randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH));
}

export function hashOtp(email: string, otp: string) {
  return createHash("sha256")
    .update(`${email.toLowerCase().trim()}:${otp}:${getOtpSecret()}`)
    .digest("hex");
}

export function getOtpExpiryDate() {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

export function isOtpExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() < Date.now();
}

export function canResendOtp(createdAt: string) {
  const elapsed = Date.now() - new Date(createdAt).getTime();
  return elapsed >= RESEND_COOLDOWN_SECONDS * 1000;
}

export const otpConfig = {
  OTP_TTL_MINUTES,
  MAX_ATTEMPTS,
  RESEND_COOLDOWN_SECONDS,
};
