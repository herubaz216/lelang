import { AuctionPeriod } from "@/lib/database.types";

export function isPeriodBiddingOpen(
  period: Pick<AuctionPeriod, "status" | "end_at"> | null | undefined
): boolean {
  if (!period || period.status !== "active") return false;
  return new Date(period.end_at).getTime() > Date.now();
}

export function isPeriodClosed(
  period: Pick<AuctionPeriod, "status"> | null | undefined
): boolean {
  if (!period) return true;
  return period.status === "finished" || period.status === "cancelled";
}

export function getPeriodStatusLabel(
  period: Pick<AuctionPeriod, "status"> | null | undefined
): string {
  if (!period) return "—";
  if (period.status === "active") return "Aktif";
  if (period.status === "finished") return "Closed";
  if (period.status === "cancelled") return "Dibatalkan";
  if (period.status === "draft") return "Draft";
  return period.status;
}
