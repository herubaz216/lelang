"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BidderProfile } from "@/lib/database.types";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Gavel, Trash2 } from "lucide-react";

type BidderBidRow = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  auction_items: {
    id: string;
    lot_number: string;
    item_name: string;
    starting_price: number;
    current_price: number;
    auction_periods: {
      code: string;
      title: string;
      status: string;
    } | null;
  } | null;
};

export function BidderBidsPanel({
  bidderId,
  onBidsChange,
}: {
  bidderId: string;
  onBidsChange?: () => void;
}) {
  const [bids, setBids] = useState<BidderBidRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BidderBidRow | null>(null);
  const supabase = createClient();

  async function loadBids() {
    setLoading(true);
    const { data, error } = await supabase
      .from("bids")
      .select(
        "id, amount, status, created_at, auction_items(id, lot_number, item_name, starting_price, current_price, auction_periods(code, title, status))"
      )
      .eq("bidder_id", bidderId)
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setBids((data ?? []) as unknown as BidderBidRow[]);
  }

  useEffect(() => {
    loadBids();
  }, [bidderId]);

  async function confirmDeleteBid() {
    if (!deleteTarget) return;

    setDeleting(true);
    const { error } = await supabase.rpc("admin_delete_bid", {
      p_bid_id: deleteTarget.id,
    });
    setDeleting(false);
    setDeleteTarget(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Penawaran dihapus");
    await loadBids();
    onBidsChange?.();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-[var(--border)] px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="font-semibold text-slate-900">Riwayat Penawaran</h2>
        <p className="text-sm text-slate-500">{bids.length} penawaran tercatat</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {loading ? (
          <p className="text-sm text-slate-500">Memuat penawaran...</p>
        ) : bids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Gavel className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">Belum ada penawaran dari bidder ini.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bids.map((bid) => {
              const item = bid.auction_items;
              const period = item?.auction_periods;
              return (
                <div
                  key={bid.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-white p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[var(--primary)]">
                        {item?.lot_number ?? "—"}
                      </span>
                      <Badge status={bid.status} />
                      {period && <Badge status={period.status} />}
                    </div>
                    {item ? (
                      <Link
                        href={`/lots/${item.id}`}
                        className="mt-1 block truncate font-medium text-slate-900 hover:text-[var(--primary)]"
                      >
                        {item.item_name}
                      </Link>
                    ) : (
                      <p className="mt-1 truncate font-medium text-slate-900">Barang tidak ditemukan</p>
                    )}
                    {period && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {period.code} — {period.title}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <div>
                        <span className="text-slate-400">Penawaran: </span>
                        <span className="font-semibold text-slate-900">
                          {formatRupiah(bid.amount)}
                        </span>
                      </div>
                      {item && (
                        <div>
                          <span className="text-slate-400">Harga terkini: </span>
                          <span className="font-medium text-emerald-700">
                            {formatRupiah(item.current_price)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateTime(bid.created_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    aria-label="Hapus penawaran"
                    onClick={() => setDeleteTarget(bid)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus Penawaran"
        message={
          deleteTarget
            ? `Yakin ingin menghapus penawaran ${formatRupiah(deleteTarget.amount)} untuk ${deleteTarget.auction_items?.lot_number ?? "barang ini"}? Harga terkini barang akan disesuaikan ulang.`
            : ""
        }
        confirmLabel="Hapus"
        loading={deleting}
        onConfirm={confirmDeleteBid}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
