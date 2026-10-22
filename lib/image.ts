/** Resize an uploaded image in the browser and encode it as WebP (base64, no data: prefix). */
export async function compressImage(file: File, maxWidth: number): Promise<{ mime: string; base64: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // older Safari can't encode WebP and silently returns PNG, so fall back to JPEG there
  const webp = canvas.toDataURL("image/webp", 0.85).startsWith("data:image/webp");
  const mime = webp ? "image/webp" : "image/jpeg";
  for (const quality of [0.85, 0.75, 0.6]) {
    const base64 = canvas.toDataURL(mime, quality).split(",")[1];
    // stay well under the database limit (2 MB of base64)
    if (base64.length < 1_500_000) return { mime, base64 };
  }
  throw new Error("image_too_large");
}
