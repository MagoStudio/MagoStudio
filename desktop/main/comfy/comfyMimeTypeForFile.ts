import path from "node:path";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm"
};

export const comfyMimeTypeForFile = (filePath: string): string =>
  MIME_BY_EXTENSION[path.extname(filePath).toLowerCase()] ?? "image/png";
