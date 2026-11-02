import { faker } from "@faker-js/faker";

import { Clip } from "@/schemas/clip";

import { createAsset } from "./asset";

export function createClip(overrides?: Partial<Clip>): Clip {
  const asset = createAsset();

  return {
    id: faker.string.uuid(),
    name: faker.music.songName(),
    asset_id: asset.id,
    layer_id: faker.string.uuid(),
    asset: asset,
    data: {
      fps: 24,
      duration: 1000,
      timeline_offset: 0
    },
    ...overrides
  };
}
