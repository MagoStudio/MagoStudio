import { z } from "zod";

export const VideoSettingsSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.undefined(),
    z.tuple([z.number(), z.number()])
  ])
);

const trimMetadata = z.object({
  trimStart: z.number(),
  trimEnd: z.number()
});

export type TrimMetadata = z.infer<typeof trimMetadata>;
