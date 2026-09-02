"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getPhotoUrl } from "@/lib/format";

type PreviewImage = {
  id: string;
  storage_path: string;
};

export function ImagePreviewDialog({
  images,
  index,
  onIndexChange,
  onClose,
  alt = "Preview foto",
}: {
  images: PreviewImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  alt?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (images.length <= 1) return;

      if (event.key === "ArrowLeft") {
        onIndexChange(index === 0 ? images.length - 1 : index - 1);
      }

      if (event.key === "ArrowRight") {
        onIndexChange(index === images.length - 1 ? 0 : index + 1);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [images.length, index, onClose, onIndexChange]);

  if (!mounted || images.length === 0) {
    return null;
  }

  const photo = images[index];
  const hasMultiple = images.length > 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Preview foto"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="text-sm font-medium">
          Foto {index + 1} / {images.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          aria-label="Tutup preview"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4"
        onClick={onClose}
      >
        {hasMultiple && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onIndexChange(index === 0 ? images.length - 1 : index - 1);
            }}
            className="absolute left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:left-6"
            aria-label="Foto sebelumnya"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div
          className="relative flex h-full w-full max-h-[calc(100dvh-7rem)] max-w-6xl items-center justify-center"
          onClick={(event) => event.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getPhotoUrl(photo.storage_path)}
            alt={`${alt} - foto ${index + 1}`}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {hasMultiple && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onIndexChange(index === images.length - 1 ? 0 : index + 1);
            }}
            className="absolute right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:right-6"
            aria-label="Foto berikutnya"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
