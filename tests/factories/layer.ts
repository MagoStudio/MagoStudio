import { faker } from "@faker-js/faker";

import { Data } from "@/schemas/data";
import { Layer, LayerType } from "@/schemas/layer";

import { createClip } from "./clip";
import { USER_TEST_ID } from "./user";

const DEFAULT_VIDEO_WIDTH = 1920;
const DEFAULT_VIDEO_HEIGHT = 1080;

export function createLayer(overrides?: Partial<Layer>): Layer {
  return {
    id: faker.string.uuid(),
    name: faker.music.songName(),
    timeline_id: faker.string.uuid(),
    user_id: USER_TEST_ID,
    type: faker.helpers.arrayElement(Object.values(LayerType)),
    active: true,
    muted: false,
    visible: true,
    layer_order: faker.number.int({ min: 0, max: 10 }),
    rating: 0,
    created_at: faker.date.past(),
    data: createLayerData(),
    clips: [createClip()],
    ...overrides
  };
}

export function createLayerData(overrides?: Partial<Data>): Data {
  return {
    duration: faker.number.int({ min: 1, max: 60 }),
    processed: true,
    fps: 30,
    size: [DEFAULT_VIDEO_WIDTH, DEFAULT_VIDEO_HEIGHT],
    renderSettings: {
      magov2: {}
    },
    renderEngine: "magov2",
    parent_render: faker.string.uuid(),
    thumbnails: [],
    ...overrides
  };
}
