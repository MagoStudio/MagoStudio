import { and, eq } from "drizzle-orm";

import { DatabaseManager } from "../database/databaseManager";
import { cloudLinks } from "../database/schema";

/**
 * Reads and writes the local-to-cloud id mapping.
 *
 * The mirror is derived state. Nothing here may alter a local record, and a
 * missing or stale link is always recoverable by mirroring again — so callers
 * can treat a link as a cache, not as a source of truth.
 */

export type CloudLinkKind = "project" | "timeline" | "asset";

export interface CloudLink {
  kind: CloudLinkKind;
  localId: string;
  cloudId: string;
  syncedAt: Date | null;
  data: Record<string, unknown>;
}

const parseData = (value: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

export class CloudLinkRepository {
  constructor(private readonly manager: DatabaseManager) {}

  async get(kind: CloudLinkKind, localId: string): Promise<CloudLink | null> {
    const database = this.manager.get();
    const [row] = await database
      .select()
      .from(cloudLinks)
      .where(and(eq(cloudLinks.kind, kind), eq(cloudLinks.localId, localId)))
      .limit(1);
    if (!row) return null;
    return {
      kind: row.kind as CloudLinkKind,
      localId: row.localId,
      cloudId: row.cloudId,
      syncedAt: row.syncedAt ?? null,
      data: parseData(row.dataJson)
    };
  }

  /**
   * Records a mirror, replacing any previous one for that local record. A cloud
   * record that has gone away is simply superseded here.
   */
  async put(input: {
    kind: CloudLinkKind;
    localId: string;
    cloudId: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    const database = this.manager.get();
    const now = new Date();
    await database
      .insert(cloudLinks)
      .values({
        kind: input.kind,
        localId: input.localId,
        cloudId: input.cloudId,
        syncedAt: now,
        dataJson: JSON.stringify(input.data ?? {}),
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [cloudLinks.kind, cloudLinks.localId],
        set: {
          cloudId: input.cloudId,
          syncedAt: now,
          dataJson: JSON.stringify(input.data ?? {}),
          updatedAt: now
        }
      });
  }

  /** Merges into the stored payload rather than replacing it. */
  async patchData(
    kind: CloudLinkKind,
    localId: string,
    patch: Record<string, unknown>
  ): Promise<void> {
    const existing = await this.get(kind, localId);
    if (!existing) throw new Error(`No cloud link for ${kind} ${localId}`);
    await this.put({
      kind,
      localId,
      cloudId: existing.cloudId,
      data: { ...existing.data, ...patch }
    });
  }

  async delete(kind: CloudLinkKind, localId: string): Promise<void> {
    const database = this.manager.get();
    await database
      .delete(cloudLinks)
      .where(and(eq(cloudLinks.kind, kind), eq(cloudLinks.localId, localId)));
  }
}
