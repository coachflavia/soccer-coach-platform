export type LocalImageAsset = {
  /** Prototype-only data URL. Replace with a storage URL when cloud storage is introduced. */
  dataUrl: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  width: number;
  height: number;
  updatedAt: string;
};

const MAX_DIMENSION = 512;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

export async function prepareLocalImage(file: File): Promise<LocalImageAsset> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a JPG, PNG, or WebP image.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("Choose an image smaller than 10 MB.");

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("The selected image could not be read."));
      element.src = sourceUrl;
    });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is not available in this browser.");
    context.drawImage(image, 0, 0, width, height);
    const mimeType: LocalImageAsset["mimeType"] = file.type === "image/png" ? "image/png" : "image/jpeg";
    const dataUrl = canvas.toDataURL(mimeType, 0.82);
    if (dataUrl.length > 700_000) throw new Error("This image is still too large after resizing. Try a simpler or smaller image.");
    return { dataUrl, mimeType, width, height, updatedAt: new Date().toISOString() };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
