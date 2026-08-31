"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BidderAuthShell } from "@/components/auth/bidder-auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ensureBidderProfile } from "@/lib/bidder-auth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    const { error: profileSyncError } = await ensureBidderProfile(
      supabase,
      data.user
    );

    if (profileSyncError) {
      setLoading(false);
      toast.error(profileSyncError.message);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    setLoading(false);
    toast.success("Login berhasil");

    const destination =
      profile?.role === "ga" || profile?.role === "accounting"
        ? "/admin"
        : redirect;

    router.push(destination);
    router.refresh();
  }

  return (
    <BidderAuthShell title="Login Bidder" subtitle="Masuk dengan email dan password">
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
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
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Masuk..." : "Login"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Belum punya akun?{" "}
            <Link
              href={`/daftar?redirect=${encodeURIComponent(redirect)}`}
              className="font-semibold text-[var(--primary)] hover:underline"
            >
              Daftar sebagai Bidder
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-400">
            <Link href="/" className="hover:text-slate-600">
              Kembali ke beranda
            </Link>
          </p>
        </CardContent>
      </Card>
    </BidderAuthShell>
  );
}
