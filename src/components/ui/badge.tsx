import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  draft: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  finished: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
  ready: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  sold: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  unsold: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  valid: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  outbid: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  winner: "bg-amber-500/20 text-amber-300 border-amber-500/30",
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
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        variants[status] ?? "bg-white/10 text-white border-white/20",
        className
      )}
    >
      {status}
    </span>
  );
}
