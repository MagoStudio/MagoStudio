import { faker } from "@faker-js/faker";

import { LayerType } from "@/schemas/layer";
import { Shot } from "@/schemas/shot";

import { createLayer } from "./layer";
import { USER_TEST_ID } from "./user";

export function createShot(overrides?: Partial<Shot>): Shot {
  return {
    id: faker.string.uuid(),
    name: faker.music.songName(),
    project_id: faker.string.uuid(),
    user_id: USER_TEST_ID,
    layers: [
      createLayer({ type: LayerType.IMAGE, layer_order: 1 }),
      createLayer({ type: LayerType.RENDER, layer_order: 2 }),
      createLayer({ type: LayerType.RENDER, layer_order: 3 })
    ],
    settings: {},
    ...overrides
  };
}
