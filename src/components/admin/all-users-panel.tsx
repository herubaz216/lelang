"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination, DEFAULT_PAGE_SIZE } from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/format";
import type { RegisteredUserRow } from "@/lib/admin-users";
import { toast } from "sonner";
import { ArrowLeft, Search, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileView = "list" | "detail";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function UserDetail({ user }: { user: RegisteredUserRow }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailField label="NIK Karyawan" value={user.employee_nik} />
        <DetailField label="Alias Publik" value={user.public_alias} />
        <DetailField label="Nama Lengkap" value={user.full_name} />
        <DetailField label="Email / Username" value={user.username ?? "—"} />
        <DetailField
          label="Status"
          value={user.is_active ? "Aktif" : "Nonaktif"}
        />
        <DetailField
          label="Akun Login"
          value={user.auth_user_id ? "Sudah terhubung" : "Belum terhubung"}
        />
        <DetailField
          label="Perusahaan Terdaftar"
          value={
            user.company_name
              ? `${user.company_name} (${user.company_code?.toUpperCase() ?? "-"})`
              : "—"
          }
        />
        <DetailField label="Total Penawaran" value={`${user.bid_count} penawaran`} />
        <DetailField label="Tanggal Daftar" value={formatDateTime(user.created_at)} />
        <DetailField
          label="Terakhir Diperbarui"
          value={formatDateTime(user.updated_at)}
        />
      </div>
    </div>
  );
}

export function AllUsersPanel() {
  const [users, setUsers] = useState<RegisteredUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>("list");

  const selectedUser = users.find((user) => user.id === selectedId) ?? null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(DEFAULT_PAGE_SIZE),
        });
        if (debouncedSearch) {
          params.set("q", debouncedSearch);
        }

        const response = await fetch(`/api/admin/users?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Gagal memuat user");
        }

        const list = (data.users ?? []) as RegisteredUserRow[];
        setUsers(list);
        setTotal(data.total ?? 0);
        setSelectedId((current) => {
          if (current && list.some((user) => user.id === current)) {
            return current;
          }
          return list[0]?.id ?? null;
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal memuat user");
        setUsers([]);
        setTotal(0);
        setSelectedId(null);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [page, debouncedSearch]);

  function selectUser(id: string) {
    setSelectedId(id);
    setMobileView("detail");
  }

  function backToList() {
    setMobileView("list");
  }

  return (
    <div className="flex flex-col lg:min-h-0 lg:flex-1">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Semua User</h1>
        <p className="text-sm text-slate-500">
          Daftar seluruh peserta yang terdaftar di sistem E-Lelang
        </p>
      </div>

      <div className="mb-4">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari NIK, nama, atau alias..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
        <div
          className={cn(
            "flex flex-col rounded-2xl border border-[var(--border)] bg-white lg:w-[22rem] lg:shrink-0 lg:overflow-hidden xl:w-96",
            mobileView === "detail" ? "hidden lg:flex" : "flex",
            "lg:min-h-[520px]"
          )}
        >
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Daftar User</p>
            <p className="text-xs text-slate-500">{total} user terdaftar</p>
          </div>

          <div className="p-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {loading ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">Memuat user...</p>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <UserCircle className="h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  {debouncedSearch ? "User tidak ditemukan." : "Belum ada user terdaftar."}
                </p>
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectUser(user.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") selectUser(user.id);
                  }}
                  className={cn(
                    "mb-1 w-full cursor-pointer rounded-xl p-3 text-left transition-colors",
                    selectedId === user.id
                      ? "bg-indigo-50 ring-1 ring-indigo-200"
                      : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[var(--primary)]">
                      {user.employee_nik}
                    </span>
                    <Badge status={user.is_active ? "active" : "cancelled"} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-900">
                    {user.full_name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">Alias: {user.public_alias}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {user.bid_count === 0
                      ? "Belum ada penawaran"
                      : `${user.bid_count} penawaran`}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="min-w-0 border-t border-[var(--border)] px-3 py-3">
            <Pagination
              page={page}
              pageSize={DEFAULT_PAGE_SIZE}
              total={total}
              onPageChange={setPage}
              className="border-t-0 pt-0"
            />
          </div>
        </div>

        <div className="hidden min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-white lg:flex lg:flex-col lg:min-h-[520px]">
          {selectedUser ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-[var(--border)] px-4 py-4 sm:px-5">
                <p className="font-semibold text-slate-900">{selectedUser.full_name}</p>
                <p className="text-sm text-slate-500">
                  {selectedUser.employee_nik} &bull; {selectedUser.public_alias}
                </p>
              </div>
              <div className="overflow-y-auto p-4 sm:p-5">
                <UserDetail user={selectedUser} />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-slate-500">
              Pilih user untuk melihat detail
            </div>
          )}
        </div>

        <div
          className={cn(
            "rounded-2xl border border-[var(--border)] bg-white lg:hidden",
            mobileView === "list" && "hidden"
          )}
        >
          {selectedUser && (
            <div>
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={backToList}
                  aria-label="Kembali ke daftar"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {selectedUser.full_name}
                  </p>
                  <p className="font-mono text-xs text-[var(--primary)]">
                    {selectedUser.employee_nik}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <UserDetail user={selectedUser} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
