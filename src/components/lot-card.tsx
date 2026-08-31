import Link from "next/link";
import Image from "next/image";
import { AuctionItem, ItemPhoto } from "@/lib/database.types";
import { formatRupiah, getPhotoUrl } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export function LotCard({
  item,
  photos,
  biddingClosed,
}: {
  item: AuctionItem;
  photos?: ItemPhoto[];
  biddingClosed?: boolean;
}) {
  const photo = photos?.[0];

  return (
    <Link href={`/lots/${item.id}`} className="group block">
      <article className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md sm:rounded-2xl">
        <div className="relative aspect-square overflow-hidden bg-slate-100 sm:aspect-[4/3]">
          {photo ? (
            <Image
              src={getPhotoUrl(photo.storage_path)}
              alt={item.item_name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-3xl opacity-40 sm:text-5xl">📦</span>
            </div>
          )}
          <div className="absolute left-2 top-2 flex flex-col gap-1 sm:left-3 sm:top-3">
            <Badge status={item.status} className="text-[10px] sm:text-xs" />
            {biddingClosed && (
              <span className="inline-flex items-center rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] font-semibold text-white sm:text-xs">
                Closed
              </span>
            )}
          </div>
          <div className="absolute right-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 backdrop-blur-sm sm:right-3 sm:top-3 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs">
            {item.lot_number}
          </div>
        </div>

        <div className="p-3 sm:p-5">
          {item.category && (
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--primary)] sm:mb-1.5 sm:text-xs">
              {item.category}
            </p>
          )}
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 transition-colors group-hover:text-[var(--primary)] sm:text-base">
            {item.item_name}
          </h3>
          <div className="mt-2 flex items-end justify-between border-t border-[var(--border)] pt-2 sm:mt-4 sm:pt-4">
            <div>
              <p className="text-[10px] text-slate-500 sm:text-xs">Harga saat ini</p>
              <p className="text-sm font-bold text-slate-900 sm:text-lg">
                {formatRupiah(item.current_price)}
              </p>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
