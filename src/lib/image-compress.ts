const MAX_BYTES = 600 * 1024;
const MAX_DIMENSION = 1920;

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

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal membaca gambar"));
    };
    img.src = url;
  });
}

/** Compress image to max ~600KB before upload (camera photos are often 2MB+). */
export async function compressImageFile(
  file: File,
  maxBytes = MAX_BYTES
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  if (file.size <= maxBytes) {
    return file;
  }

  const image = await loadImage(file);
  const dimensionScale = Math.min(
    1,
    MAX_DIMENSION / Math.max(image.width, image.height)
  );
  const baseWidth = Math.round(image.width * dimensionScale);
  const baseHeight = Math.round(image.height * dimensionScale);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Browser tidak mendukung kompres gambar");
  }

  let sizeScale = 1;
  let result: Blob | null = null;

  for (let attempt = 0; attempt < 8; attempt++) {
    const width = Math.max(1, Math.round(baseWidth * sizeScale));
    const height = Math.max(1, Math.round(baseHeight * sizeScale));
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

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

  if (!result) {
    throw new Error("Gambar terlalu besar, coba foto ulang");
  }

  const baseName = file.name.replace(/\.[^.]+$/i, "") || "photo";
  return new File([result], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
