import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";

import { readCloudLinkedLocalIds } from "./readCloudLinkedLocalIds";
import * as schema from "./schema";

export interface CloudMirroredTracks {
  cloudMirroredTrackIds: Set<string>;
  wasMirroredBeforeTrackLinksExisted: boolean;
}

export const readCloudMirroredTracks = async (
  database: SqliteRemoteDatabase<typeof schema>,
  cloudProjectTrackIds: string[]
): Promise<CloudMirroredTracks> => {
  const linkedTrackIds = await readCloudLinkedLocalIds(
    database,
    "layer",
    cloudProjectTrackIds
  );
  const wasMirroredBeforeTrackLinksExisted =
    cloudProjectTrackIds.length > 0 && linkedTrackIds.size === 0;
  return {
    cloudMirroredTrackIds: wasMirroredBeforeTrackLinksExisted
      ? new Set(cloudProjectTrackIds)
      : linkedTrackIds,
    wasMirroredBeforeTrackLinksExisted
  };
};
