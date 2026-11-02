import { faker } from "@faker-js/faker";
import { extractDefaultVideoSettings } from "@models/video/extractDefaultVideoSettings";
import { magoV3_4_0RenderModel } from "@models/video/magoV3_4_0VideoModel";
import { VideoEngine } from "@models/video/types";

import { Asset, AssetType } from "@/schemas/asset";

export function createAsset(overrides?: Partial<Asset>): Asset {
  return {
    id: faker.string.uuid(),
    name: faker.system.fileName(),
    filepath: faker.system.filePath(),
    type: faker.helpers.enumValue(AssetType),
    created_at: faker.date.past(),
    updated_at: faker.date.recent(),
    origin: "generated",
    last_used: faker.date.recent(),
    rate: 0,
    data: {
      origin: "generated",
      fps: 24,
      duration: 1000,
      size: [1920, 1080],
      data: {
        render_settings: {
          magov2: {
            ...extractDefaultVideoSettings(magoV3_4_0RenderModel),
            ipadapter_image_source: faker.string.uuid(),
            mago_engine: VideoEngine.V3_4_0
          }
        }
      },
      renderEngine: "magov2"
    },
    //show_done: faker.datatype.boolean(),
    //ETA: faker.number.int({ min: 0, max: 3600 }),
    //render_started_at: faker.date.past(),
    /*frame_range: [
      faker.number.int({ min: 0, max: 100 }),
      faker.number.int({ min: 101, max: 1000 })
    ] as [number, number],*/
    //finished_at: faker.date.recent(),
    manifest: {
      controlNets: [
        {
          video: faker.system.fileName(),
          name: faker.word.noun(),
          metadata: {
            fps: faker.number.int({ min: 24, max: 60 }),
            width: faker.number.int({ min: 640, max: 1920 }),
            height: faker.number.int({ min: 360, max: 1080 }),
            nb_frames: faker.number.int({ min: 30, max: 300 })
          }
        }
      ]
    },
    ...overrides
  };
}
