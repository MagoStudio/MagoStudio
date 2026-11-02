import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { swapInNodePack } from "./swapInNodePack";

describe("swapInNodePack", () => {
  let directory = "";
  beforeEach(async () => {
    directory = await mkdtemp(path.join(os.tmpdir(), "swap-node-pack-"));
  });
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it("replaces the installed pack and keeps the old one aside", async () => {
    const nodePackDirectory = path.join(directory, "custom_nodes", "pack");
    const stagedNodePack = path.join(directory, "staging", "pack");
    const replacedNodePack = path.join(directory, "replaced", "pack");
    await mkdir(nodePackDirectory, { recursive: true });
    await writeFile(path.join(nodePackDirectory, "version.txt"), "old");
    await mkdir(stagedNodePack, { recursive: true });
    await writeFile(path.join(stagedNodePack, "version.txt"), "new");

    await swapInNodePack({
      stagedNodePack,
      nodePackDirectory,
      replacedNodePack
    });

    await expect(
      readFile(path.join(nodePackDirectory, "version.txt"), "utf8")
    ).resolves.toBe("new");
    await expect(
      readFile(path.join(replacedNodePack, "version.txt"), "utf8")
    ).resolves.toBe("old");
  });

  it("puts the old pack back when the staged pack cannot be moved in", async () => {
    const nodePackDirectory = path.join(directory, "custom_nodes", "pack");
    await mkdir(nodePackDirectory, { recursive: true });
    await writeFile(path.join(nodePackDirectory, "version.txt"), "old");

    await expect(
      swapInNodePack({
        stagedNodePack: path.join(directory, "missing-staging"),
        nodePackDirectory,
        replacedNodePack: path.join(directory, "replaced", "pack")
      })
    ).rejects.toThrow();
    await expect(
      readFile(path.join(nodePackDirectory, "version.txt"), "utf8")
    ).resolves.toBe("old");
  });
});
