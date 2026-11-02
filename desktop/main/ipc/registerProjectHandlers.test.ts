import { beforeEach, describe, expect, it, vi } from "vitest";

const { handlers } = vi.hoisted(() => ({
  handlers: new Map<
    string,
    (event: unknown, value: unknown) => Promise<unknown>
  >()
}));

vi.mock("electron", () => ({
  ipcMain: {
    handle: (
      channel: string,
      handler: (event: unknown, value: unknown) => Promise<unknown>
    ) => handlers.set(channel, handler)
  }
}));
vi.mock("./trustedSender", () => ({ requireTrustedSender: () => undefined }));

import { IPC_CHANNELS } from "../../shared/contracts";
import type { CloudProjectMirrorRepository } from "../database/cloudProjectMirrorRepository";
import type { DatabaseManager } from "../database/databaseManager";
import type { ProjectRepository } from "../database/projectRepository";
import type { LibrarySettings } from "../librarySettings";

import { registerProjectHandlers } from "./registerProjectHandlers";

describe("tracks:create parent track order validation", () => {
  const createTrack = vi.fn();
  const input = {
    shotId: "shot-1",
    name: "Render",
    type: "RENDER",
    data: {}
  };
  const create = (parentTrackOrder?: unknown) =>
    handlers.get(IPC_CHANNELS.tracksCreate)!(
      {},
      { ...input, parentTrackOrder }
    );

  beforeEach(() => {
    vi.clearAllMocks();
    handlers.clear();
    registerProjectHandlers(
      { createTrack } as unknown as ProjectRepository,
      {} as CloudProjectMirrorRepository,
      { isOpen: () => true } as unknown as DatabaseManager,
      {} as LibrarySettings
    );
  });

  it.each([0, 1, 7])(
    "passes the source track order %s to the repository",
    async (parentTrackOrder) => {
      await create(parentTrackOrder);
      expect(createTrack).toHaveBeenCalledWith({ ...input, parentTrackOrder });
    }
  );

  it.each([undefined, null, 1.5, NaN, Infinity, "1"])(
    "rejects invalid parent track order %s",
    async (parentTrackOrder) => {
      await expect(create(parentTrackOrder)).rejects.toThrow(
        "parentTrackOrder must be an integer"
      );
      expect(createTrack).not.toHaveBeenCalled();
    }
  );
});

describe("tracks:update rating validation", () => {
  const updateTrack = vi.fn();
  const input = { trackId: "track-1", name: "Render", data: {} };
  const update = (rating?: unknown) =>
    handlers.get(IPC_CHANNELS.tracksUpdate)!({}, { ...input, rating });

  beforeEach(() => {
    vi.clearAllMocks();
    handlers.clear();
    registerProjectHandlers(
      { updateTrack } as unknown as ProjectRepository,
      {} as CloudProjectMirrorRepository,
      { isOpen: () => true } as unknown as DatabaseManager,
      {} as LibrarySettings
    );
  });

  it.each([0, 10, 20, 30])(
    "persists the UI rating %s unchanged",
    async (rating) => {
      await update(rating);
      expect(updateTrack).toHaveBeenCalledWith({ ...input, rating });
    }
  );

  it.each([undefined, null])(
    "allows updates without a rating (%s)",
    async (rating) => {
      await update(rating);
      expect(updateTrack).toHaveBeenCalledWith({ ...input, rating: undefined });
    }
  );

  it.each([-10, 1, 3, 15, 40, 10.5, NaN, Infinity, "10"])(
    "rejects invalid rating %s",
    async (rating) => {
      await expect(update(rating)).rejects.toThrow(
        "rating must be 0, 10, 20, or 30"
      );
      expect(updateTrack).not.toHaveBeenCalled();
    }
  );
});
