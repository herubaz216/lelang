import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { lotDetailHref, type NextLotItem } from "@/lib/lot-href";
import { ChevronRight } from "lucide-react";

export function LotDetailNav({
  nextItem,
  category,
}: {
  nextItem: NextLotItem | null;
  category?: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <BackButton fallbackHref="/" />
      {nextItem ? (
        <Link href={lotDetailHref(nextItem.id, category)} className="shrink-0">
          <Button type="button" variant="outline" size="sm" className="gap-1.5">
            <span className="max-w-[9rem] truncate sm:max-w-[14rem]">
              Next: {nextItem.lot_number}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </Button>
        </Link>
      ) : (
        <span className="text-xs text-slate-400 sm:text-sm">Lot terakhir</span>
      )}
    </div>
  );
}
