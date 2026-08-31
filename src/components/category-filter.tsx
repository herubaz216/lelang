"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type CategoryInfo = { name: string; count: number };

export function CategoryFilter({
  categories,
  activeCategory,
  totalItems,
  onChange,
}: {
  categories: CategoryInfo[];
  activeCategory: string;
  totalItems: number;
  onChange: (category: string) => void;
}) {
  const allOptions = [
    { name: "all", label: `Semua (${totalItems})` },
    ...categories.map((c) => ({
      name: c.name,
      label: `${c.name} (${c.count})`,
    })),
  ];

  return (
    <>
      {/* Mobile: dropdown */}
      <div className="relative md:hidden">
        <select
          value={activeCategory}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-[var(--border)] bg-white px-4 pr-10 text-sm font-medium text-slate-900 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          {allOptions.map((opt) => (
            <option key={opt.name} value={opt.name}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {/* Desktop: wrap pills */}
      <div className="hidden flex-wrap gap-2 md:flex">
        <button
          type="button"
          onClick={() => onChange("all")}
          className={cn(
            "rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
            activeCategory === "all"
              ? "bg-[var(--primary)] text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-[var(--border)] hover:bg-slate-50"
          )}
        >
          Semua ({totalItems})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => onChange(cat.name)}
            className={cn(
              "rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
              activeCategory === cat.name
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-[var(--border)] hover:bg-slate-50"
            )}
          >
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>
    </>
  );
}
