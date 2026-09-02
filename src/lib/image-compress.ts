const MAX_BYTES = 600 * 1024;
const MAX_DIMENSION = 1920;

function isImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Gagal mengompres gambar"))),
      type,
      quality
    );
  });
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== "undefined") {
    return createImageBitmap(file, { imageOrientation: "from-image" });
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Gagal membaca gambar"));
      img.src = url;
    });

    return createImageBitmap(image);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Resize and compress any image upload to max ~600KB JPEG (camera + gallery). */
export async function compressImageFile(
  file: File,
  maxBytes = MAX_BYTES
): Promise<File> {
  if (!isImageFile(file)) {
    return file;
  }

  const bitmap = await loadBitmap(file);
  const dimensionScale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
  );
  const baseWidth = Math.max(1, Math.round(bitmap.width * dimensionScale));
  const baseHeight = Math.max(1, Math.round(bitmap.height * dimensionScale));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Browser tidak mendukung kompres gambar");
  }

  let sizeScale = 1;
  let result: Blob | null = null;

  try {
    for (let attempt = 0; attempt < 8; attempt++) {
      const width = Math.max(1, Math.round(baseWidth * sizeScale));
      const height = Math.max(1, Math.round(baseHeight * sizeScale));
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);

      let quality = 0.85;
      while (quality >= 0.35) {
        const blob = await canvasToBlob(canvas, "image/jpeg", quality);
        if (blob.size <= maxBytes) {
          result = blob;
          break;
        }
        quality -= 0.07;
      }

      if (result) break;
      sizeScale *= 0.85;
    }
  } finally {
    bitmap.close();
  }

  if (!result) {
    throw new Error("Gambar terlalu besar, coba foto ulang");
  }

  const baseName = file.name.replace(/\.[^.]+$/i, "") || "photo";
  return new File([result], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
