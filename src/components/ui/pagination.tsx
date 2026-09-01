import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DEFAULT_PAGE_SIZE = 10;

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  if (total === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "@container flex w-full min-w-0 flex-col gap-2 overflow-hidden border-t border-[var(--border)] pt-4 @lg:flex-row @lg:items-center @lg:justify-between @lg:gap-3",
        className
      )}
    >
      <p className="min-w-0 text-xs text-slate-500 @sm:text-sm">
        Menampilkan {from}–{to} dari {total}
      </p>
      <div className="flex w-full min-w-0 items-center justify-between gap-2 @lg:w-auto @lg:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Halaman sebelumnya"
          className="shrink-0 px-2.5 @lg:px-3"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="hidden @lg:inline">Sebelumnya</span>
        </Button>
        <span className="shrink-0 px-1 text-center text-sm tabular-nums text-slate-600">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Halaman berikutnya"
          className="shrink-0 px-2.5 @lg:px-3"
        >
          <span className="hidden @lg:inline">Berikutnya</span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </Button>
      </div>
    </div>
  );
}
