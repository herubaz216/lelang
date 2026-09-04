"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Loader2, Package, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { onFavoritesChanged, notifyFavoritesChanged } from "@/lib/favorite-events";
import { formatRupiah, getPhotoUrl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FavoriteItemRow = {
  id: string;
  item_id: string;
  created_at: string;
  auction_items: {
    id: string;
    lot_number: string;
    item_name: string;
    current_price: number;
    status: string;
    item_photos: { storage_path: string; sort_order: number }[] | null;
  } | null;
};

export function FavoritesMenu({ className }: { className?: string }) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<FavoriteItemRow[]>([]);

  const loginHref = `/login?redirect=${encodeURIComponent(pathname)}`;
  const count = rows.length;

  const loadFavorites = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUserId(null);
      setRows([]);
      setAuthReady(true);
      return;
    }

    setUserId(user.id);
    setLoading(true);
    const { data, error } = await supabase
      .from("favorites")
      .select(
        `
        id,
        item_id,
        created_at,
        auction_items (
          id,
          lot_number,
          item_name,
          current_price,
          status,
          item_photos ( storage_path, sort_order )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      toast.error(error.message || "Gagal memuat favorit");
      setRows([]);
    } else {
      setRows((data ?? []) as unknown as FavoriteItemRow[]);
    }
    setLoading(false);
    setAuthReady(true);
  }, [supabase]);

  useEffect(() => {
    void loadFavorites();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadFavorites();
    });
    return () => subscription.unsubscribe();
  }, [loadFavorites, supabase]);

  useEffect(() => {
    return onFavoritesChanged(() => {
      void loadFavorites();
    });
  }, [loadFavorites]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function removeFavorite(favoriteId: string) {
    if (!userId) return;
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", favoriteId)
      .eq("user_id", userId);
    if (error) {
      toast.error(error.message || "Gagal menghapus favorit");
      return;
    }
    setRows((prev) => prev.filter((row) => row.id !== favoriteId));
    notifyFavoritesChanged();
    toast.success("Dihapus dari favorit");
  }

  function handleTrigger() {
    if (!userId) {
      window.location.href = loginHref;
      return;
    }
    setOpen((prev) => !prev);
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="relative gap-1.5 px-2 text-slate-700 sm:px-3"
        onClick={handleTrigger}
        aria-label="Favorit"
        title="Favorit"
        disabled={!authReady}
      >
        <Heart className={cn("h-4 w-4", count > 0 && "fill-rose-500 text-rose-500")} />
        <span className="hidden sm:inline">Favorit</span>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Button>

      {open && userId && (
        <>
          <button
            type="button"
            aria-label="Tutup favorit"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-3 top-[4.25rem] z-50 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[22rem]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Favorit</p>
                <p className="text-xs text-slate-500">{count} lot tersimpan</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat...
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-10 text-center">
                  <Package className="h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-700">Belum ada favorit</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tekan Favoritkan di halaman lot untuk menyimpan.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {rows.map((row) => {
                    const item = row.auction_items;
                    if (!item) return null;
                    const photos = [...(item.item_photos ?? [])].sort(
                      (a, b) => a.sort_order - b.sort_order
                    );
                    const thumb = photos[0]?.storage_path;
                    return (
                      <li key={row.id} className="flex items-stretch gap-2 p-2">
                        <Link
                          href={`/lots/${item.id}`}
                          onClick={() => setOpen(false)}
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 hover:bg-slate-50"
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {thumb ? (
                              <Image
                                src={getPhotoUrl(thumb)}
                                alt={item.item_name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-lg opacity-40">
                                📦
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-indigo-600">
                              {item.lot_number}
                            </p>
                            <p className="truncate text-sm font-medium text-slate-900">
                              {item.item_name}
                            </p>
                            <p className="text-xs font-semibold text-slate-700">
                              {formatRupiah(item.current_price)}
                            </p>
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => void removeFavorite(row.id)}
                          className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Hapus favorit"
                          title="Hapus"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
