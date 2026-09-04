"use client";

import { cn } from "@/lib/utils";

type CategoryInfo = { name: string; count: number };

export function CategoryFilter({
  categories,
  activeCategory,
  totalItems,
  onChange,
  hideAll = false,
}: {
  categories: CategoryInfo[];
  activeCategory: string;
  totalItems: number;
  onChange: (category: string) => void;
  hideAll?: boolean;
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden">
      {!hideAll && (
        <button
          type="button"
          onClick={() => onChange("all")}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors sm:px-5 sm:py-2.5",
            activeCategory === "all"
              ? "bg-[var(--primary)] text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-[var(--border)] hover:bg-slate-50"
          )}
        >
          Semua ({totalItems})
        </button>
      )}
      {categories.map((cat) => (
        <button
          key={cat.name}
          type="button"
          onClick={() => onChange(cat.name)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors sm:px-5 sm:py-2.5",
            activeCategory === cat.name
              ? "bg-[var(--primary)] text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-[var(--border)] hover:bg-slate-50"
          )}
        >
          {cat.name} ({cat.count})
        </button>
      ))}
    </div>
  );
}
