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
  className,
}: {
  period: AuctionPeriod;
  itemCount?: number;
  className?: string;
}) {
  const [exporting, setExporting] = useState(false);
  const supabase = createClient();

  async function handleExport() {
    if (itemCount === 0) {
      toast.error("Belum ada barang untuk diekspor");
      return;
    }

    setExporting(true);
    try {
      await downloadPeriodExcel(supabase, period);
      toast.success("Excel berhasil diunduh");
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
    >
      <Download className="h-4 w-4" />
      {exporting ? "Mengekspor..." : "Export Excel"}
    </Button>
  );
}
