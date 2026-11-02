import "@config/i18n";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  isSyncing: false,
  catalog: null as { completed: number; total: number } | null,
  downloads: { ready: 0, queued: 0, downloading: 0, failed: 0 }
}));
vi.mock("@domains/scriptProject/useIsCloudProjectSyncing", () => ({
  useIsCloudProjectSyncing: () => state.isSyncing
}));
vi.mock("@domains/scriptProject/useCloudProjectCatalogSyncProgress", () => ({
  useCloudProjectCatalogSyncProgress: () => state.catalog
}));
vi.mock("@domains/asset/mediaDownloads", () => ({
  mediaDownloads: {
    subscribe: () => () => {},
    getSnapshot: () => state.downloads
  }
}));

import { HomeCloudSyncProgress } from "./HomeCloudSyncProgress";

beforeEach(() => {
  state.isSyncing = false;
  state.catalog = null;
  state.downloads = { ready: 0, queued: 0, downloading: 0, failed: 0 };
});
describe("HomeCloudSyncProgress", () => {
  it("hides when synchronization and downloads are idle", () => {
    render(<HomeCloudSyncProgress />);
    expect(screen.queryByRole("status")).toBeNull();
  });
  it("shows actual project counts and percentage", () => {
    state.isSyncing = true;
    state.catalog = { completed: 1, total: 4 };
    render(<HomeCloudSyncProgress />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Syncing projects · 1/4"
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "25"
    );
  });
  it("shows download progress after the catalog has finished", () => {
    state.downloads = { ready: 3, queued: 2, downloading: 1, failed: 0 };
    render(<HomeCloudSyncProgress />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Downloading for offline use · 3/6"
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "50"
    );
  });
  it("does not invent a percentage before the project list arrives", () => {
    state.isSyncing = true;
    render(<HomeCloudSyncProgress />);
    expect(screen.getByRole("status")).toHaveTextContent("Syncing…");
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
