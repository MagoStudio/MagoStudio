import { z } from "zod";

import { backendApiClient } from "@/lib/backend-api-client";

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

export const getSheetImageInputs = async (
  clipId: string
): Promise<SheetImageInputs> => {
  const response = await backendApiClient.get(
    `/assets/img2img/status/${clipId}`
  );
  return SheetImageInputsSchema.parse(response.data);
};
