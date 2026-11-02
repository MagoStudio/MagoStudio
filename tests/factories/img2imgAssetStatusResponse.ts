import { faker } from "@faker-js/faker";
import { Img2ImgRenderStatus } from "@models/img2img/types";

import { Img2ImgRenderStatusResponse } from "@/schemas/img2imgRenderStatus";

export function createImg2ImgAssetStatusResponse(
  overrides?: Partial<Img2ImgRenderStatusResponse>
): Img2ImgRenderStatusResponse {
  return {
    data: {
      frame: faker.number.int({ min: 0, max: 100 }),
      generated_at: faker.date.past().toISOString(),
      status: "success",
      settings: {},
      source_asset: faker.string.uuid(),
      source: "img2img"
    },
    output_url: "https://example.com/generated-image.jpg",
    render_status: Img2ImgRenderStatus.SUCCESS,
    progress: 100,
    thumbnail_url: "https://example.com/thumbnail.jpg",
    ...overrides
  };
}
