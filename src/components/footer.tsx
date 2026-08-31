import Link from "next/link";
import { Gavel } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-white">
      <div className="container-app py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]">
                <Gavel className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900">E-Lelang</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Platform lelang aset operasional internal perusahaan.
            </p>
          </div>
          <div className="flex gap-16">
            <div>
              <p className="text-sm font-semibold text-slate-900">Navigasi</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link href="/lots" className="text-sm text-slate-500 hover:text-slate-900">
                    Semua Lot
                  </Link>
                </li>
                <li>
                  <Link href="/hasil" className="text-sm text-slate-500 hover:text-slate-900">
                    Cek Hasil Pemenang
                  </Link>
                </li>
                <li>
                  <Link href="/bid-saya" className="text-sm text-slate-500 hover:text-slate-900">
                    Bid Saya
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Staff</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-[var(--border)] pt-6 text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} E-Lelang. Internal use only.
        </div>
      </div>
    </footer>
  );
}
