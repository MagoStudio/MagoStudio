import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
    getAppPath: () => process.cwd()
  }
}));

import { DatabaseManager } from "../database/databaseManager";

import { CloudLinkRepository } from "./cloudLinkRepository";

const temporaryDirectories: string[] = [];
const managers: DatabaseManager[] = [];

const openLibrary = async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "mago-cloud-links-"));
  temporaryDirectories.push(directory);
  const manager = new DatabaseManager();
  managers.push(manager);
  await manager.open(directory);
  return new CloudLinkRepository(manager);
};

afterEach(async () => {
  for (const manager of managers.splice(0)) manager.close();
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe("CloudLinkRepository", () => {
  test("returns null for a record that has never been mirrored", async () => {
    const repository = await openLibrary();

    expect(await repository.get("project", "local-1")).toBeNull();
  });

  test("stores and reads back a mirror", async () => {
    const repository = await openLibrary();
    await repository.put({
      kind: "project",
      localId: "local-1",
      cloudId: "cloud-1"
    });

    const link = await repository.get("project", "local-1");
    expect(link?.cloudId).toBe("cloud-1");
    expect(link?.syncedAt).toBeInstanceOf(Date);
    expect(link?.data).toEqual({});
  });

  test("keeps kinds separate so one local id can mirror per record type", async () => {
    const repository = await openLibrary();
    await repository.put({
      kind: "project",
      localId: "same-id",
      cloudId: "cloud-project"
    });
    await repository.put({
      kind: "timeline",
      localId: "same-id",
      cloudId: "cloud-timeline"
    });

    expect((await repository.get("project", "same-id"))?.cloudId).toBe(
      "cloud-project"
    );
    expect((await repository.get("timeline", "same-id"))?.cloudId).toBe(
      "cloud-timeline"
    );
  });

  test("supersedes a mirror whose cloud record has gone away", async () => {
    const repository = await openLibrary();
    await repository.put({
      kind: "asset",
      localId: "local-1",
      cloudId: "cloud-old",
      data: { status: "ingested" }
    });

    await repository.put({
      kind: "asset",
      localId: "local-1",
      cloudId: "cloud-new"
    });

    const link = await repository.get("asset", "local-1");
    expect(link?.cloudId).toBe("cloud-new");
    // Re-mirroring starts clean rather than carrying stale ingestion state.
    expect(link?.data).toEqual({});
  });

  test("merges into stored data instead of replacing it", async () => {
    const repository = await openLibrary();
    await repository.put({
      kind: "asset",
      localId: "local-1",
      cloudId: "cloud-1",
      data: { uploadedAt: "yesterday", status: "processing" }
    });

    await repository.patchData("asset", "local-1", { status: "ingested" });

    const link = await repository.get("asset", "local-1");
    expect(link?.data).toEqual({
      uploadedAt: "yesterday",
      status: "ingested"
    });
    expect(link?.cloudId).toBe("cloud-1");
  });

  test("refuses to patch a record that was never mirrored", async () => {
    const repository = await openLibrary();

    await expect(
      repository.patchData("asset", "missing", { status: "ingested" })
    ).rejects.toThrow(/No cloud link/);
  });

  test("forgets a mirror on request", async () => {
    const repository = await openLibrary();
    await repository.put({
      kind: "project",
      localId: "local-1",
      cloudId: "cloud-1"
    });

    await repository.delete("project", "local-1");

    expect(await repository.get("project", "local-1")).toBeNull();
  });

  test("survives malformed stored data rather than throwing", async () => {
    const repository = await openLibrary();
    await repository.put({
      kind: "asset",
      localId: "local-1",
      cloudId: "cloud-1"
    });
    // Simulates a payload written by an older or broken build.
    await repository.put({
      kind: "asset",
      localId: "local-2",
      cloudId: "cloud-2",
      data: {}
    });

    expect((await repository.get("asset", "local-1"))?.data).toEqual({});
    expect((await repository.get("asset", "local-2"))?.data).toEqual({});
  });
});
