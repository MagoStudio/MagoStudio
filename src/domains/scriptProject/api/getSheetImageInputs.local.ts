import { isCloudRenderAvailable } from "@platform/renderTarget";
import { z } from "zod";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

const SheetImageInputsSchema = z.object({
  render_status: z.string().nullable().optional(),
  output_url: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  error_message: z.string().nullable().optional(),
  data: z
    .object({
      error_message: z.string().nullable().optional(),
      settings: z.record(z.string(), z.unknown()).nullable().optional()
    })
    .nullable()
    .optional()
});

export type SheetImageInputs = z.infer<typeof SheetImageInputsSchema>;

/** A local sheet image answers from its own record (`render_settings`, or
 * just the prompt on images rendered before that was stored); anything else
 * is a cloud clip, asked about only while the cloud is reachable. */
export const getSheetImageInputs = async (
  clipId: string
): Promise<SheetImageInputs> => {
  const media = await getLocalDesktopApi().scriptProjects.findMedia({ clipId });
  if (media?.image) {
    const image = media.image;
    const settings =
      image.render_settings &&
      typeof image.render_settings === "object" &&
      !Array.isArray(image.render_settings)
        ? (image.render_settings as Record<string, unknown>)
        : typeof image.prompt === "string"
          ? { prompt: image.prompt }
          : null;
    return SheetImageInputsSchema.parse({
      render_status: "COMPLETED",
      output_url: image.url ?? null,
      thumbnail_url: image.thumbnail_url ?? null,
      data: { settings }
    });
  }
  if (!isCloudRenderAvailable()) return {};
  const response = await backendApiClient.get(
    `/assets/img2img/status/${clipId}`
  );
  return SheetImageInputsSchema.parse(response.data);
};
