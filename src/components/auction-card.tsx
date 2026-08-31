import Link from "next/link";
import Image from "next/image";
import { AuctionItem, ItemPhoto } from "@/lib/database.types";
import { formatRupiah, getPhotoUrl } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function AuctionCard({
  item,
  photos,
}: {
  item: AuctionItem;
  photos?: ItemPhoto[];
}) {
  const photo = photos?.[0];

  return (
    <Link href={`/lots/${item.id}`}>
      <Card className="group overflow-hidden transition-all hover:border-amber-500/30 hover:shadow-amber-500/10">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-800">
          {photo ? (
            <Image
              src={getPhotoUrl(photo.storage_path)}
              alt={item.item_name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">
              <span className="text-4xl">📦</span>
            </div>
          )}
          <div className="absolute left-3 top-3">
            <Badge status={item.status} />
          </div>
          <div className="absolute right-3 top-3 rounded-lg bg-slate-900/80 px-2 py-1 text-xs font-mono text-amber-400">
            {item.lot_number}
          </div>
        </div>
        <CardContent className="space-y-2">
          {item.category && (
            <p className="text-xs uppercase tracking-wider text-slate-400">
              {item.category}
            </p>
          )}
          <h3 className="font-semibold text-white line-clamp-1">
            {item.item_name}
          </h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-400">Harga saat ini</p>
              <p className="text-lg font-bold text-amber-400">
                {formatRupiah(item.current_price)}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              +{formatRupiah(item.bid_increment)}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
