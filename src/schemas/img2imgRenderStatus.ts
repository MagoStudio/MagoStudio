import { Img2ImgRenderStatus } from "@models/img2img/types";
import { z } from "zod";

const Img2ImgRenderStatusResponseSchema = z.object({
  data: z.object({
    frame: z.number(),
    generated_at: z.string(),
    status: z.string(),
    settings: z.record(z.string(), z.any()),
    source_asset: z.string(),
    source: z.string(),
    batch_clips: z.array(z.string()).optional(),
    render_job_id: z.string().optional(),
    lock: z.unknown().optional(),
    progress: z.number().optional()
  }),
  output_url: z.string().optional(),
  output_urls: z.array(z.string()).optional(),
  progress: z.number().optional(),
  render_status: z.enum(Img2ImgRenderStatus),
  thumbnail_url: z.string().optional(),
  thumbnail_urls: z.array(z.string()).optional()
});

export type Img2ImgRenderStatusResponse = z.infer<
  typeof Img2ImgRenderStatusResponseSchema
>;
