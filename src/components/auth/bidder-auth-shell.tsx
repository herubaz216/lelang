import { Gavel } from "lucide-react";

export function BidderAuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-indigo-600 to-indigo-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Gavel className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">E-Lelang</span>
        </div>
        <div>
          <p className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Khusus Bidder
          </p>
          <h2 className="text-3xl font-bold leading-tight">
            Ikuti lelang aset internal perusahaan
          </h2>
          <p className="mt-4 max-w-md text-indigo-200">
            Login atau daftar dengan NIK karyawan untuk mengajukan penawaran pada
            barang lelang.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <Gavel className="h-6 w-6 text-[var(--primary)]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
              Bidder
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="hidden lg:block lg:mb-6 lg:text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
              Bidder
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
