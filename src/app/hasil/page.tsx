import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { fetchFinishedPeriods, fetchWinners } from "@/lib/winners";
import { formatRupiah, getPhotoUrl } from "@/lib/format";
import { Trophy, Package, ChevronRight } from "lucide-react";

export default async function HasilPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodId } = await searchParams;
  const periods = await fetchFinishedPeriods();
  const { period, rows } = await fetchWinners(periodId);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-[var(--border)] bg-white">
          <div className="container-app py-10 sm:py-14">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Cek Hasil Pemenang
                </h1>
                <p className="mt-1 text-slate-500">
                  Daftar pemenang lelang per periode
                </p>
              </div>
            </div>

            {periods.length > 1 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {periods.map((p) => (
                  <Link
                    key={p.id}
                    href={`/hasil?period=${p.id}`}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      period?.id === p.id
                        ? "bg-[var(--primary)] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {p.code}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="container-app py-8 sm:py-12">
          {!period ? (
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
            <>
              <div className="mb-6 rounded-xl border border-[var(--border)] bg-indigo-50/50 px-4 py-3 sm:px-5">
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  Periode
                </p>
                <p className="font-semibold text-slate-900">{period.title}</p>
                <p className="text-sm text-slate-500">{period.code}</p>
              </div>

              {rows.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-white py-16 text-center text-slate-500">
                  Tidak ada barang dalam periode ini.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
                  {/* Desktop header */}
                  <div className="hidden grid-cols-[72px_1fr_120px_140px_140px] gap-4 border-b border-[var(--border)] bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
                    <span>Gambar</span>
                    <span>Nama Barang</span>
                    <span className="text-right">Harga Awal</span>
                    <span>Bidder</span>
                    <span className="text-right">Last Price</span>
                  </div>

                  <ul className="divide-y divide-[var(--border)]">
                    {rows.map((row, index) => (
                      <li key={row.itemId}>
                        <Link
                          href={`/lots/${row.itemId}`}
                          className="group block transition-colors hover:bg-slate-50/80"
                        >
                          {/* Desktop row */}
                          <div className="hidden items-center gap-4 px-5 py-4 lg:grid lg:grid-cols-[72px_1fr_120px_140px_140px]">
                            <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-slate-100">
                              {row.photoPath ? (
                                <Image
                                  src={getPhotoUrl(row.photoPath)}
                                  alt={row.itemName}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xl">
                                  📦
                                </div>
                              )}
                              {index < 3 && row.bidderAlias && (
                                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white">
                                  {index + 1}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-mono text-xs font-semibold text-[var(--primary)]">
                                {row.lotNumber}
                              </span>
                              <p className="truncate font-medium text-slate-900 group-hover:text-[var(--primary)]">
                                {row.itemName}
                              </p>
                            </div>
                            <p className="text-right text-sm text-slate-600">
                              {formatRupiah(row.startingPrice)}
                            </p>
                            <p className="truncate text-sm font-medium text-slate-800">
                              {row.bidderAlias ?? (
                                <span className="text-slate-400">—</span>
                              )}
                            </p>
                            <p className="text-right text-sm font-bold text-emerald-700">
                              {formatRupiah(row.lastPrice)}
                            </p>
                          </div>

                          {/* Mobile card */}
                          <div className="flex gap-3 p-4 lg:hidden">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                              {row.photoPath ? (
                                <Image
                                  src={getPhotoUrl(row.photoPath)}
                                  alt={row.itemName}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-2xl">
                                  📦
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="font-mono text-[10px] font-semibold text-[var(--primary)]">
                                    {row.lotNumber}
                                  </span>
                                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                                    {row.itemName}
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                <div>
                                  <p className="text-slate-400">Harga Awal</p>
                                  <p className="font-medium text-slate-700">
                                    {formatRupiah(row.startingPrice)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-slate-400">Last Price</p>
                                  <p className="font-bold text-emerald-700">
                                    {formatRupiah(row.lastPrice)}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-slate-400">Bidder</p>
                                  <p className="font-medium text-slate-800">
                                    {row.bidderAlias ?? "—"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
