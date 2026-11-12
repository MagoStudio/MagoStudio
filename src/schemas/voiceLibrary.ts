import { z } from "zod";

export const StockVoiceSchema = z.object({
  voice_id: z.string(),
  name: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  description: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  preview_url: z.string().nullable().optional()
});

export type StockVoice = z.infer<typeof StockVoiceSchema>;
