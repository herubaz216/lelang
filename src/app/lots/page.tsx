import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { LotCard } from "@/components/lot-card";
import { CompanySwitcher } from "@/components/home/company-switcher";
import { StripedHeroBackground } from "@/components/striped-hero-background";
import { AuctionItem, ItemPhoto } from "@/lib/database.types";
import {
  fetchCompanies,
  fetchCompanyByCode,
  resolveCompanyCode,
} from "@/lib/companies";

export default async function LotsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { company: companyParam } = await searchParams;
  const companies = await fetchCompanies();
  const companyCode = resolveCompanyCode(companyParam, companies);
  const company =
    (await fetchCompanyByCode(companyCode)) ?? companies[0] ?? null;

  if (!company) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container-app flex flex-1 items-center justify-center py-20 text-slate-500">
          Perusahaan belum dikonfigurasi.
        </main>
        <Footer />
      </div>
    );
  }

  const supabase = await createClient();

  const { data: periods } = await supabase
    .from("auction_periods")
    .select("id")
    .eq("company_id", company.id);
  const periodIds = (periods ?? []).map((period) => period.id);

  const { data: items } = periodIds.length
    ? await supabase
        .from("auction_items")
        .select("*")
        .in("period_id", periodIds)
        .in("status", ["active", "ready", "sold"])
        .order("lot_number")
    : { data: [] as AuctionItem[] };

  const itemIds = (items ?? []).map((item) => item.id);
  const { data: photos } = itemIds.length
    ? await supabase
        .from("item_photos")
        .select("*")
        .in("item_id", itemIds)
        .order("sort_order")
    : { data: [] as ItemPhoto[] };

  const itemsWithPhotos = (items ?? []).map((item: AuctionItem) => ({
    item,
    photos: (photos ?? []).filter((photo) => photo.item_id === item.id),
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <CompanySwitcher
        companies={companies}
        activeCompany={company}
        basePath="/lots"
      />
      <main className="flex-1">
        <div className="relative overflow-hidden border-b border-[var(--border)] bg-white">
          <StripedHeroBackground />
          <div className="container-app relative py-10 sm:py-14">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              {company.short_name}
            </p>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Semua Lot</h1>
            <p className="mt-2 text-slate-500">
              {itemsWithPhotos.length} barang tersedia untuk dilelang
            </p>
          </div>
        </div>
        <div className="container-app py-10">
          {itemsWithPhotos.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-slate-500">Belum ada lot tersedia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
              {itemsWithPhotos.map(({ item, photos: itemPhotos }) => (
                <LotCard key={item.id} item={item} photos={itemPhotos} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
