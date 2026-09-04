"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuctionPeriod } from "@/lib/database.types";
import { downloadPeriodExcel } from "@/lib/period-excel-export";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

export function PeriodExportButton({
  period,
  itemCount = 0,
  category = "all",
  className,
}: {
  period: AuctionPeriod;
  itemCount?: number;
  category?: string;
  className?: string;
}) {
  const [exporting, setExporting] = useState(false);
  const supabase = createClient();
  const categoryLabel = !category || category === "all" ? "Semua" : category;

  async function handleExport() {
    if (itemCount === 0) {
      toast.error(
        category && category !== "all"
          ? `Belum ada barang di kategori ${category}`
          : "Belum ada barang untuk diekspor"
      );
      return;
    }

    setExporting(true);
    try {
      toast.message(
        `Menyiapkan Excel + foto (${categoryLabel}), mohon tunggu...`
      );
      await downloadPeriodExcel(supabase, period, category);
      toast.success(`Excel berhasil diunduh — ${categoryLabel}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengekspor data periode"
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={exporting || itemCount === 0}
      onClick={() => void handleExport()}
      title={`Export kategori: ${categoryLabel}`}
    >
      <Download className="h-4 w-4" />
      {exporting ? "Mengekspor..." : "Export Excel"}
    </Button>
  );
}
