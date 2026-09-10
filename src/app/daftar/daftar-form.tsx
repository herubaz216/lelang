"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BidderAuthShell } from "@/components/auth/bidder-auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "form" | "otp";
type NikStatus = "idle" | "loading" | "verified" | "error" | "taken";

type EmployeeMatchOption = {
  nomorInduk: string;
  fullName: string;
  pt: string;
  companyId?: string;
  companyCode?: string;
};

export default function DaftarForm() {
  const [step, setStep] = useState<Step>("form");
  const [employeeNik, setEmployeeNik] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedPt, setSelectedPt] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [ptOptions, setPtOptions] = useState<EmployeeMatchOption[]>([]);
  const [showPtDialog, setShowPtDialog] = useState(false);
  const [pendingPtSelection, setPendingPtSelection] = useState<string>("");
  const [nikStatus, setNikStatus] = useState<NikStatus>("idle");
  const [nikMessage, setNikMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const lookupRequestId = useRef(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  function resetEmployeeFields() {
    setFullName("");
    setSelectedPt("");
    setSelectedCompanyId("");
    setPtOptions([]);
    setShowPtDialog(false);
    setPendingPtSelection("");
  }

  function applyEmployeeMatch(match: EmployeeMatchOption) {
    setFullName(match.fullName);
    setSelectedPt(match.pt);
    setSelectedCompanyId(match.companyId ?? "");
    setNikStatus("verified");
    setNikMessage("");
    setShowPtDialog(false);
    setPendingPtSelection("");
  }

  useEffect(() => {
    const nik = employeeNik.trim();
    if (!nik) {
      resetEmployeeFields();
      setNikStatus("idle");
      setNikMessage("");
      return;
    }

    const requestId = ++lookupRequestId.current;
    const timer = window.setTimeout(async () => {
      setNikStatus("loading");
      resetEmployeeFields();
      setNikMessage("");

      try {
        const res = await fetch(
          `/api/employee/by-nik?nomor_induk=${encodeURIComponent(nik)}`
        );
        const data = await res.json();

        if (requestId !== lookupRequestId.current) return;

        if (res.status === 409 || data.alreadyRegistered) {
          setNikStatus("taken");
          setNikMessage(
            data.error ?? "NIK sudah terdaftar di E-Lelang. Silakan login."
          );
          return;
        }

        if (!res.ok) {
          setNikStatus("error");
          setNikMessage(data.error ?? "NIK tidak ditemukan");
          toast.error(data.error ?? "NIK tidak ditemukan");
          return;
        }

        const matches = (data.matches ?? []) as EmployeeMatchOption[];
        if (matches.length > 1) {
          setPtOptions(matches);
          setPendingPtSelection(matches[0]?.pt ?? "");
          setShowPtDialog(true);
          setNikStatus("idle");
          setNikMessage("Pilih perusahaan (PT) untuk NIK ini");
          return;
        }

        const single = matches[0] ?? {
          nomorInduk: data.nomorInduk as string,
          fullName: (data.fullName as string) ?? "",
          pt: (data.pt as string) ?? "",
          companyId: data.companyId as string | undefined,
          companyCode: data.companyCode as string | undefined,
        };
        setPtOptions(matches.length ? matches : [single]);
        applyEmployeeMatch(single);
      } catch {
        if (requestId !== lookupRequestId.current) return;
        setNikStatus("error");
        setNikMessage("Gagal memverifikasi NIK karyawan");
        toast.error("Gagal memverifikasi NIK karyawan");
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [employeeNik]);

  function handleNikChange(value: string) {
    setEmployeeNik(value);
    if (nikStatus !== "idle") {
      setNikStatus("idle");
      setNikMessage("");
      resetEmployeeFields();
    }
  }

  function handleConfirmPt() {
    const match =
      ptOptions.find((option) => option.pt === pendingPtSelection) ??
      ptOptions[0];
    if (!match) {
      toast.error("Pilih perusahaan terlebih dahulu");
      return;
    }
    applyEmployeeMatch(match);
    toast.success(`Perusahaan dipilih: ${match.pt}`);
  }

  function handleCancelPt() {
    setShowPtDialog(false);
    setPendingPtSelection("");
    setPtOptions([]);
    setFullName("");
    setSelectedPt("");
    setSelectedCompanyId("");
    setNikStatus("idle");
    setNikMessage("Pilih perusahaan (PT) untuk melanjutkan verifikasi NIK");
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const nik = employeeNik.trim();
    const name = fullName.trim();
    const emailValue = email.trim();

    if (!nik || nikStatus !== "verified" || !name) {
      setLoading(false);
      toast.error("Verifikasi NIK karyawan terlebih dahulu");
      return;
    }

    if (ptOptions.length > 1 && !selectedPt) {
      setLoading(false);
      setShowPtDialog(true);
      toast.error("Pilih perusahaan (PT) terlebih dahulu");
      return;
    }

    if (!emailValue || password.length < 6) {
      setLoading(false);
      toast.error("Lengkapi semua field dengan benar");
      return;
    }

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailValue,
        employeeNik: nik,
        fullName: name,
        pt: selectedPt || undefined,
        companyId: selectedCompanyId || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Gagal mengirim OTP");
      return;
    }

    toast.success("Kode OTP telah dikirim ke email Anda");
    setStep("otp");
  }

  async function handleVerifyAndRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        otp: otp.trim(),
        password,
        employeeNik: employeeNik.trim(),
        fullName: fullName.trim(),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Registrasi gagal");
      return;
    }

    toast.success("Registrasi berhasil! Silakan login.");
    router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
    router.refresh();
  }

  async function handleResendOtp() {
    setLoading(true);

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        employeeNik: employeeNik.trim(),
        fullName: fullName.trim(),
        pt: selectedPt || undefined,
        companyId: selectedCompanyId || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Gagal mengirim ulang OTP");
      return;
    }

    setOtp("");
    toast.success("Kode OTP baru telah dikirim");
  }

  return (
    <BidderAuthShell
      title={step === "form" ? "Daftar Bidder" : "Verifikasi Email"}
      subtitle={
        step === "form"
          ? "Isi data diri, lalu verifikasi email dengan OTP"
          : `Masukkan kode 6 digit yang dikirim ke ${email}`
      }
      showSketchArt
    >
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          {step === "form" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeNik">NIK Karyawan</Label>
                <Input
                  id="employeeNik"
                  value={employeeNik}
                  onChange={(e) => handleNikChange(e.target.value)}
                  placeholder="Masukkan NIK karyawan"
                  autoComplete="username"
                  required
                />
                {nikStatus === "loading" && (
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Memverifikasi NIK...
                  </p>
                )}
                {nikStatus === "verified" && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    NIK terverifikasi
                    {selectedPt ? ` · ${selectedPt}` : ""}
                  </p>
                )}
                {nikStatus === "taken" && (
                  <p className="flex items-start gap-1.5 text-xs font-medium text-red-600">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {nikMessage}{" "}
                      <Link
                        href={`/login?redirect=${encodeURIComponent(redirect)}`}
                        className="font-semibold underline"
                      >
                        Login di sini
                      </Link>
                    </span>
                  </p>
                )}
                {nikStatus === "error" && nikMessage && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                    <XCircle className="h-3.5 w-3.5" />
                    {nikMessage}
                  </p>
                )}
                {nikStatus === "idle" && nikMessage && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                    <Building2 className="h-3.5 w-3.5" />
                    {nikMessage}
                  </p>
                )}
                {ptOptions.length > 1 && nikStatus === "verified" && (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingPtSelection(selectedPt || ptOptions[0]?.pt || "");
                      setShowPtDialog(true);
                    }}
                    className="text-xs font-semibold text-[var(--primary)] hover:underline"
                  >
                    Ganti perusahaan
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Karyawan</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  readOnly
                  placeholder={
                    nikStatus === "loading"
                      ? "Mengambil data karyawan..."
                      : "Otomatis dari NIK karyawan"
                  }
                  autoComplete="name"
                  className="cursor-not-allowed bg-slate-50 text-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full gap-2"
                size="lg"
                disabled={loading || nikStatus !== "verified" || !fullName}
              >
                <Mail className="h-4 w-4" />
                {loading ? "Mengirim OTP..." : "Kirim Kode OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                Kode OTP berlaku 10 menit. Cek inbox atau folder spam.
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Kode OTP</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className="text-center text-2xl font-bold tracking-[0.4em]"
                  autoComplete="one-time-code"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                size="lg"
                disabled={loading || otp.length !== 6}
              >
                <ShieldCheck className="h-4 w-4" />
                {loading ? "Memverifikasi..." : "Verifikasi & Daftar"}
              </Button>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Ubah data
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-sm font-semibold text-[var(--primary)] hover:underline disabled:opacity-50"
                >
                  Kirim ulang OTP
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Sudah punya akun?{" "}
            <Link
              href={`/login?redirect=${encodeURIComponent(redirect)}`}
              className="font-semibold text-[var(--primary)] hover:underline"
            >
              Login
            </Link>
          </p>
        </CardContent>
      </Card>

      {showPtDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Tutup dialog"
            className="absolute inset-0 bg-black/40"
            onClick={handleCancelPt}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pt-dialog-title"
            className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                <Building2 className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <h3
                  id="pt-dialog-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Pilih Perusahaan
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  NIK ini terdaftar di lebih dari satu PT. Pilih PT yang sesuai,
                  nama karyawan akan mengikuti data PT tersebut.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {ptOptions.map((option) => {
                const selected = pendingPtSelection === option.pt;
                return (
                  <button
                    key={`${option.pt}-${option.nomorInduk}`}
                    type="button"
                    onClick={() => setPendingPtSelection(option.pt)}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                      selected
                        ? "border-[var(--primary)] bg-indigo-50 ring-1 ring-[var(--primary)]"
                        : "border-[var(--border)] bg-white hover:bg-slate-50"
                    )}
                  >
                    <p className="font-semibold text-slate-900">{option.pt}</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {option.fullName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      NIK {option.nomorInduk}
                      {option.companyCode
                        ? ` · ${option.companyCode.toUpperCase()}`
                        : ""}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={handleCancelPt}>
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmPt}
                disabled={!pendingPtSelection}
              >
                Gunakan PT ini
              </Button>
            </div>
          </div>
        </div>
      )}
    </BidderAuthShell>
  );
}
