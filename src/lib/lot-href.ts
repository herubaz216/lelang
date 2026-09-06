export type NextLotItem = {
  id: string;
  lot_number: string;
  item_name: string;
};

export function lotDetailHref(itemId: string, category?: string | null) {
  if (!category || category === "all") return `/lots/${itemId}`;
  return `/lots/${itemId}?category=${encodeURIComponent(category)}`;
}
