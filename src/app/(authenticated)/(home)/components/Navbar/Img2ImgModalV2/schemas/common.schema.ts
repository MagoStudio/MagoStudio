import { z } from "zod";

export const DEFAULT_IMG2IMG_PROMPT =
  "Stylize into an anime with flat colors and clear outlines, keep the composition of the original image";

export const CommonModelSchema = {
  frameType: z.enum(["video", "upload"]).default("video"),
  uploadedImageId: z.string().optional(),
  iteratedAssetId: z.string().optional(),
  iteratedSourceFrame: z.number().optional()
};

export const validateUploadMode = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
) => {
  return schema.refine(
    (data: {
      frameType?: string;
      iteratedAssetId?: string;
      uploadedImageId?: string;
    }) => {
      if (data.frameType === "video") {
        return true;
      }

      const hasIteratedAsset =
        data.iteratedAssetId && data.iteratedAssetId.length > 0;
      const hasUploadedImage =
        data.uploadedImageId && data.uploadedImageId.length > 0;

      return hasIteratedAsset || hasUploadedImage;
    },
    {
      message:
        "Upload mode requires either an iterated image or an uploaded file",
      path: ["uploadedImageId"]
    }
  );
};
