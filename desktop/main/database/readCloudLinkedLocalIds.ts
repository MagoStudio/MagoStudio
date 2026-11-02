import { and, eq, inArray } from "drizzle-orm";
import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";

import * as schema from "./schema";
import { cloudLinks } from "./schema";

export type CloudMirroredContentLinkKind = "layer" | "clip";

export const readCloudLinkedLocalIds = async (
  database: SqliteRemoteDatabase<typeof schema>,
  kind: CloudMirroredContentLinkKind,
  localIds: string[]
): Promise<Set<string>> => {
  if (localIds.length === 0) return new Set();
  const linkedRows = await database
    .select({ localId: cloudLinks.localId })
    .from(cloudLinks)
    .where(
      and(eq(cloudLinks.kind, kind), inArray(cloudLinks.localId, localIds))
    );
  return new Set(linkedRows.map((row) => row.localId));
};
