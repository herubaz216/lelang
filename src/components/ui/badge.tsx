import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  draft: "bg-slate-100 text-slate-600 ring-slate-500/10",
  finished: "bg-slate-100 text-slate-700 ring-slate-500/20",
  closed: "bg-slate-100 text-slate-700 ring-slate-500/20",
  cancelled: "bg-red-50 text-red-700 ring-red-600/20",
  ready: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  sold: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  unsold: "bg-orange-50 text-orange-700 ring-orange-600/20",
  valid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  outbid: "bg-slate-100 text-slate-500 ring-slate-500/10",
  winner: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

const statusLabels: Record<string, string> = {
  finished: "Closed",
  cancelled: "Dibatalkan",
  active: "Active",
  draft: "Draft",
  ready: "Ready",
  sold: "Sold",
  unsold: "Unsold",
};

export function Badge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        statusStyles[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/10",
        className
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
