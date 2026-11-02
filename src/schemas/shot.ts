import { z } from "zod";

import { LayerSchema } from "@/schemas/layer";

export const ShotSchema = z.object({
  id: z.string(),
  name: z.string(),
  project_id: z.string(),
  user_id: z.string(),
  layers: z.array(LayerSchema),
  settings: z.object({}).nullable().default({})
});

export type Shot = z.infer<typeof ShotSchema>;
