"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { markCatalogRestorePending } from "@/lib/catalog-view-state";

export function BackButton({
  fallbackHref = "/",
  catalogReturnHref,
  label = "Kembali",
}: {
  fallbackHref?: string;
  /** Safari-safe: kembali ke katalog dengan ?focus=lotId, jangan router.back() */
  catalogReturnHref?: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={() => {
        const target = catalogReturnHref || fallbackHref;
        markCatalogRestorePending();
        // scroll:false penting — biar HomeCatalog yang restore ke lot, bukan Next ke top.
        router.push(target, { scroll: false });
      }}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
