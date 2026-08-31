import Link from "next/link";
import { Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-yellow-400">
            <Gavel className="h-5 w-5 text-slate-900" />
          </div>
          <span className="text-lg font-bold text-white">LelangCorp</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/lots"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Semua Lot
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm">
              Staff Login
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
