"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuctionPeriod, Company } from "@/lib/database.types";
import { withCompanyQuery } from "@/lib/company-utils";
import { ItemWithPhotos } from "@/lib/items";
import {
  getPeriodStatusLabel,
  isPeriodBiddingOpen,
  isPeriodClosed,
} from "@/lib/auction";
import { LotCard } from "@/components/lot-card";
import { CountdownTimer } from "@/components/countdown-timer";
import { Package, Gavel, Timer, Lock, Trophy } from "lucide-react";
import { CategoryFilter } from "@/components/category-filter";
import { StripedHeroBackground } from "@/components/striped-hero-background";
import { PushNotificationPrompt } from "@/components/push-notification-prompt";

const PAGE_SIZE = 12;

type CategoryInfo = { name: string; count: number };

export function HomeCatalog({
  company,
  period,
  categories,
  initialItems,
  initialHasMore,
  totalItems,
}: {
  company: Company;
  period: AuctionPeriod | null;
  categories: CategoryInfo[];
  initialItems: ItemWithPhotos[];
  initialHasMore: boolean;
  totalItems: number;
}) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(initialItems.length);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const skipCategoryFetch = useRef(true);
  const biddingOpen = isPeriodBiddingOpen(period);
  const periodClosed = isPeriodClosed(period);
  const statusLabel = getPeriodStatusLabel(period);
  const hasCatalogItems = totalItems > 0;

  useEffect(() => {
    setActiveCategory("all");
    setItems(initialItems);
    setHasMore(initialHasMore);
    setOffset(initialItems.length);
    skipCategoryFetch.current = true;
  }, [company.id, period?.id, initialItems, initialHasMore]);

  const loadMore = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        offset: String(currentOffset),
        limit: String(PAGE_SIZE),
        category: activeCategory,
      });
      if (period?.id) params.set("period_id", period.id);

      const res = await fetch(`/api/items?${params}`);
      const data = await res.json();

      if (reset) {
        setItems(data.items);
        setOffset(data.items.length);
      } else {
        setItems((prev) => {
          const existing = new Set(prev.map((p) => p.item.id));
          const fresh = data.items.filter(
            (p: ItemWithPhotos) => !existing.has(p.item.id)
          );
          return [...prev, ...fresh];
        });
        setOffset((prev) => prev + data.items.length);
      }
      setHasMore(data.hasMore);
      setLoading(false);
    },
    [activeCategory, loading, offset, period?.id]
  );

  useEffect(() => {
    if (skipCategoryFetch.current) {
      skipCategoryFetch.current = false;
      return;
    }
    loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) loadMore(false);
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <>
      <section className="relative overflow-hidden bg-white">
        <StripedHeroBackground />
        <div className="container-app relative py-20 lg:py-28">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
              <Gavel className="h-4 w-4" />
              {company.short_name} — Platform Lelang Internal
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
              Lelang aset operasional{" "}
              <span className="text-[var(--primary)]">{company.short_name}</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-500">
              {company.name}. Temukan barang lelang, ajukan penawaran real-time,
              dan menangkan aset terbaik untuk kebutuhan Anda.
            </p>
          </div>

          {period && (
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Package, label: "Barang Tersedia", value: String(totalItems) },
                { icon: Timer, label: "Periode", value: period.code },
                {
                  icon: periodClosed ? Lock : Gavel,
                  label: "Status",
                  value: statusLabel,
                  highlight: periodClosed,
                },
              ].map(({ icon: Icon, label, value, highlight }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      highlight ? "bg-slate-100" : "bg-indigo-50"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        highlight ? "text-slate-600" : "text-[var(--primary)]"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p
                      className={`text-lg font-semibold ${
                        highlight ? "text-slate-700" : "text-slate-900"
                      }`}
                    >
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {period && (
        <section className="container-app -mt-4 pb-8">
          {periodClosed ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-700 to-slate-900 p-8 text-white shadow-lg lg:p-10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    Closed
                  </span>
                  <h2 className="mt-3 text-2xl font-bold lg:text-3xl">{period.title}</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Periode lelang telah selesai. Penawaran tidak dapat diajukan lagi.
                  </p>
                  {period.description && (
                    <p className="mt-2 max-w-lg text-sm text-slate-400">{period.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                  <div className="flex items-center gap-3 rounded-xl bg-white/10 px-5 py-4">
                    <Lock className="h-8 w-8 shrink-0 text-slate-300" />
                    <div>
                      <p className="text-xs text-slate-400">Kode Periode</p>
                      <p className="font-mono text-lg font-semibold">{period.code}</p>
                    </div>
                  </div>
                  <Link
                    href={withCompanyQuery(`/hasil?period=${period.id}`, company.code)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-300"
                  >
                    <Trophy className="h-5 w-5" />
                    Cek Pemenang
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white shadow-lg lg:p-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-200">Periode Aktif</p>
                  <h2 className="mt-1 text-2xl font-bold lg:text-3xl">{period.title}</h2>
                  {period.description && (
                    <p className="mt-2 max-w-lg text-sm text-indigo-100">{period.description}</p>
                  )}
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium text-indigo-200">Berakhir dalam</p>
                  <CountdownTimer endAt={period.end_at} variant="hero" />
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <section id="katalog" className="container-app py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Katalog Lelang</h2>
          <p className="mt-1 text-sm text-slate-500">
            {period
              ? `${totalItems} barang tersedia dalam ${categories.length} kategori — ${company.short_name}`
              : `Belum ada periode lelang untuk ${company.short_name}`}
          </p>
        </div>

        {period && biddingOpen && (
          <PushNotificationPrompt
            companyCode={company.code}
            variant="banner"
            className="mb-6"
          />
        )}

        {!period ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
            <Package className="h-12 w-12 text-slate-300" />
            <p className="mt-4 font-medium text-slate-700">
              Belum ada periode lelang {company.short_name}
            </p>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Katalog lelang {company.name} akan tampil setelah admin membuat
              periode dan menambahkan barang.
            </p>
          </div>
        ) : !hasCatalogItems && !loading ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
            <Package className="h-12 w-12 text-slate-300" />
            <p className="mt-4 font-medium text-slate-700">
              Belum ada barang lelang {company.short_name}
            </p>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Periode {period.code} sudah tersedia, tetapi belum ada barang yang
              ditambahkan untuk {company.short_name}.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <CategoryFilter
                categories={categories}
                activeCategory={activeCategory}
                totalItems={totalItems}
                onChange={setActiveCategory}
              />
            </div>

            {items.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
                {items.map(({ item, photos }) => (
                  <div key={item.id} className="animate-in">
                    <LotCard item={item} photos={photos} biddingClosed={!biddingOpen} />
                  </div>
                ))}
              </div>
            ) : !loading ? (
              <div className="flex flex-col items-center py-20 text-center">
                <Package className="h-12 w-12 text-slate-300" />
                <p className="mt-4 text-slate-500">
                  Tidak ada barang dalam kategori ini.
                </p>
              </div>
            ) : null}

            <div ref={sentinelRef} className="h-1" />

            {loading && (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton aspect-[3/4] rounded-xl sm:rounded-2xl" />
                ))}
              </div>
            )}

            {!hasMore && items.length > 0 && (
              <p className="mt-10 text-center text-sm text-slate-400">
                Semua barang telah dimuat
              </p>
            )}
          </>
        )}
      </section>
    </>
  );
}
