import { isRenderCancelable } from "@domains/queue/utils/isRenderCancelable";
import { faker } from "@faker-js/faker";
import { QueueItem } from "@hooks/queue/interface";
import { AssetStatus } from "@schemas/asset";

import { USER_TEST_ID } from "./user";

export function createQueueItem(overrides?: Partial<QueueItem>): QueueItem {
  const createdAt = faker.date.past();
  const finishedAt = faker.date.recent();
  const status = overrides?.status ?? AssetStatus.FINISHED;

  return {
    id: faker.string.uuid(),
    active: true,
    asset_id: faker.string.uuid(),
    created_at: createdAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    frame_range: [0, 30],
    interacted_with: false,
    layer_id: faker.string.uuid(),
    layer_name: faker.music.songName(),
    order: faker.number.int({ min: 0, max: 10 }),
    price: faker.number.int({ min: 10, max: 100 }),
    progress: 100,
    project_id: faker.string.uuid(),
    project_name: faker.word.words(2),
    queue_id: "main_queue",
    render_started_at: createdAt.toISOString(),
    timeline_id: faker.string.uuid(),
    timeline_name: faker.word.words(2),
    show_done: true,
    status,
    user_id: USER_TEST_ID,
    isCancelable: isRenderCancelable({
      status,
      positionInQueue: overrides?.display_order
    }),
    ...overrides
  };
}
