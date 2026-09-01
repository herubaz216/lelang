import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CompanyWinnerGroupSection } from "@/components/hasil/company-winner-group";
import { fetchCompanyWinnerGroups } from "@/lib/winners";
import { fetchCompanies, resolveCompanyCode } from "@/lib/companies";
import { StripedHeroBackground } from "@/components/striped-hero-background";
import { Trophy, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function HasilPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; company?: string }>;
}) {
  const { period: periodId, company: companyParam } = await searchParams;
  const companies = await fetchCompanies();
  const companyCode = companyParam
    ? resolveCompanyCode(companyParam, companies)
    : undefined;

  const groups = await fetchCompanyWinnerGroups({
    companyCode,
    periodId,
  });

  const showAllCompanies = !companyCode;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-[var(--border)] bg-white">
          <StripedHeroBackground />
          <div className="container-app relative py-10 sm:py-14">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Cek Hasil Pemenang
                </h1>
                <p className="mt-1 text-slate-500">
                  {showAllCompanies
                    ? "Hasil lelang dikelompokkan per perusahaan"
                    : "Hasil lelang perusahaan terpilih"}
                </p>
              </div>
            </div>

            {companies.length > 1 && (
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href="/hasil"
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    showAllCompanies
                      ? "bg-[var(--primary)] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  Semua
                </Link>
                {companies.map((company) => (
                  <Link
                    key={company.id}
                    href={`/hasil?company=${company.code}`}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                      companyCode === company.code
                        ? "bg-[var(--primary)] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {company.short_name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="container-app space-y-8 py-8 sm:py-12">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
              <Package className="h-12 w-12 text-slate-300" />
              <p className="mt-4 font-medium text-slate-700">
                Belum ada periode yang selesai
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Hasil pemenang akan tampil setelah periode lelang ditutup.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <CompanyWinnerGroupSection
                key={group.company.id}
                company={group.company}
                period={group.period}
                periods={group.periods}
                rows={group.rows}
                bankAccounts={group.bankAccounts}
                companyCode={group.company.code}
              />
            ))
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
