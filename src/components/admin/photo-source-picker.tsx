"use client";

import { useRef, useState } from "react";
import { Camera, ImageIcon, Images } from "lucide-react";
import { cn } from "@/lib/utils";

export function PhotoSourcePicker({
  disabled,
  uploading,
  onSelect,
  className,
}: {
  disabled?: boolean;
  uploading?: boolean;
  onSelect: (file: File) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (file) onSelect(file);
    setOpen(false);
  }

  function resetInput(input: HTMLInputElement | null) {
    if (input) input.value = "";
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white text-slate-400 transition-colors hover:border-indigo-300 hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Tambah foto"
      >
        {uploading ? (
          <span className="text-[10px]">...</span>
        ) : (
          <>
            <ImageIcon className="h-5 w-5" />
            <span className="mt-0.5 text-[10px]">Tambah</span>
          </>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Tutup pilihan foto"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full left-0 z-20 mb-2 w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-lg">
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                resetInput(cameraRef.current);
                cameraRef.current?.click();
              }}
            >
              <Camera className="h-4 w-4 text-[var(--primary)]" />
              Ambil dari Kamera
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 border-t border-[var(--border)] px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                resetInput(galleryRef.current);
                galleryRef.current?.click();
              }}
            >
              <Images className="h-4 w-4 text-[var(--primary)]" />
              Pilih dari Galeri
            </button>
          </div>
        </>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          resetInput(e.target);
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          resetInput(e.target);
        }}
      />
    </div>
  );
}
