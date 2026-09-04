"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { notifyFavoritesChanged, onFavoritesChanged } from "@/lib/favorite-events";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  itemId,
  className,
}: {
  itemId: string;
  className?: string;
}) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const loginHref = `/login?redirect=${encodeURIComponent(pathname)}`;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        setUserId(null);
        setFavorited(false);
        setLoading(false);
        return;
      }

      setUserId(user.id);
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        setFavorited(false);
      } else {
        setFavorited(Boolean(data));
      }
      setLoading(false);
    }

    void load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });
    const unsubscribeFavorites = onFavoritesChanged(() => {
      void load();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
      unsubscribeFavorites();
    };
  }, [itemId, supabase]);

  async function toggleFavorite() {
    if (!userId || toggling) return;
    setToggling(true);
    const next = !favorited;
    setFavorited(next);

    if (next) {
      const { error } = await supabase.from("favorites").insert({
        user_id: userId,
        item_id: itemId,
      });
      if (error) {
        setFavorited(false);
        toast.error(error.message || "Gagal menambah favorit");
        setToggling(false);
        return;
      }
      toast.success("Ditambahkan ke favorit");
    } else {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("item_id", itemId);
      if (error) {
        setFavorited(true);
        toast.error(error.message || "Gagal menghapus favorit");
        setToggling(false);
        return;
      }
      toast.success("Dihapus dari favorit");
    }

    notifyFavoritesChanged();
    setToggling(false);
  }

  if (loading) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("gap-2", className)}
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Favorit
      </Button>
    );
  }

  if (!userId) {
    return (
      <Link href={loginHref}>
        <Button type="button" variant="outline" size="sm" className={cn("gap-2", className)}>
          <Heart className="h-4 w-4" />
          Favorit
        </Button>
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant={favorited ? "primary" : "outline"}
      size="sm"
      className={cn("gap-2", favorited && "bg-rose-600 hover:bg-rose-700", className)}
      disabled={toggling}
      onClick={() => void toggleFavorite()}
      aria-pressed={favorited}
      title={favorited ? "Hapus dari favorit" : "Tambah ke favorit"}
    >
      {toggling ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={cn("h-4 w-4", favorited && "fill-current")} />
      )}
      {favorited ? "Favorit" : "Favoritkan"}
    </Button>
  );
}
