import { STORYBOARD_IMAGE_SIZE } from "./constants";

export const createStoryboardSheetCanvas = () => {
  const canvas = document.createElement("canvas");
  canvas.width = STORYBOARD_IMAGE_SIZE.width;
  canvas.height = STORYBOARD_IMAGE_SIZE.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not acquire a 2D canvas context");
  return { canvas, ctx };
};
