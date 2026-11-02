import { z } from "zod";

import { GptImage2Schema } from "./gptImage2.schema";
import { Nanobanana2Schema } from "./nanobanana2.schema";
import { NanobananaProSchema } from "./nanobananaPro.schema";
import { QwenSchema } from "./qwen.schema";
import { Seedream5ProSchema } from "./seedream5Pro.schema";

export const Img2ImgSchema = z.discriminatedUnion("model", [
  Seedream5ProSchema,
  NanobananaProSchema,
  Nanobanana2Schema,
  QwenSchema,
  GptImage2Schema
]);
export type Img2ImgType = z.infer<typeof Img2ImgSchema>;

export const MAX_IMAGE_REFERENCE_UPLOADS = 9;

interface ImageModelDescriptor {
  label: string;
  value: Img2ImgType["model"];
  description: string;
}

export const ModelSchemaMap: Record<
  Img2ImgType["model"],
  ImageModelDescriptor
> = {
  nanobanana_pro: {
    label: "Nano Banana Pro",
    value: "nanobanana_pro",
    description: "Edit your image"
  },
  gpt_image_2: {
    label: "GPT Image 2",
    value: "gpt_image_2",
    description: "Edit your image"
  },
  seedream_5_pro: {
    label: "Seedream 5.0 Pro",
    value: "seedream_5_pro",
    description: "Edit or stylize your image"
  },
  qwen: {
    label: "Qwen Image Edit 2511",
    value: "qwen",
    description: "Edit your image"
  },
  nanobanana_2: {
    label: "Nanobanana 2",
    value: "nanobanana_2",
    description: "Edit your image"
  }
};
