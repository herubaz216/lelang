import { createClient } from "@/lib/supabase/server";
import { fetchDisplayPeriod } from "@/lib/auction-server";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { HomeCatalog } from "@/components/home/home-catalog";
import { fetchCategories, fetchItemsPage } from "@/lib/items";

export default async function HomePage() {
  const period = await fetchDisplayPeriod();

  const categories = await fetchCategories(period?.id);
  const { items, hasMore, total } = await fetchItemsPage({
    periodId: period?.id,
    category: null,
    offset: 0,
    limit: 12,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HomeCatalog
          period={period}
          categories={categories}
          initialItems={items}
          initialHasMore={hasMore}
          totalItems={total}
        />
      </main>
      <Footer />
    </div>
  );
}
