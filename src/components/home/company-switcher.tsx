"use client";

import Link from "next/link";
import { Company } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

export function CompanySwitcher({
  companies,
  activeCompany,
  basePath = "/",
}: {
  companies: Company[];
  activeCompany: Company;
  basePath?: string;
}) {
  return (
    <section className="border-b border-[var(--border)] bg-slate-50">
      <div className="container-app py-4">
        <p className="mb-3 text-center text-sm font-medium text-slate-600">
          Pilih perusahaan untuk melihat lelang
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {companies.map((company) => {
            const isActive = company.id === activeCompany.id;
            return (
              <Link
                key={company.id}
                href={`${basePath}?company=${company.code}`}
                className={cn(
                  "group flex items-start gap-4 rounded-2xl border p-4 transition-all sm:p-5",
                  isActive
                    ? "border-[var(--primary)] bg-white shadow-md ring-2 ring-indigo-100"
                    : "border-[var(--border)] bg-white hover:border-indigo-200 hover:shadow-sm"
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                    isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-bold",
                        isActive
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {company.short_name}
                    </span>
                    {isActive && (
                      <span className="text-xs font-medium text-emerald-600">Dipilih</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">
                    {company.name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
