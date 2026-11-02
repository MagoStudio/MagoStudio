import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { strToU8, zipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { downloadSetupRequirementIntoFolder } from "./downloadSetupRequirementIntoFolder";
import { NodePackAlreadyInstalledError } from "./NodePackAlreadyInstalledError";
import type { DownloadableSetupRequirement } from "./resolveSetupRequirements";

describe("downloadSetupRequirementIntoFolder with an installed node pack", () => {
  let comfyDirectory = "";
  let customNodesFolder = "";
  let requirement: DownloadableSetupRequirement;
  beforeEach(async () => {
    comfyDirectory = await mkdtemp(path.join(os.tmpdir(), "comfy-update-"));
    customNodesFolder = path.join(comfyDirectory, "custom_nodes");
    await mkdir(path.join(customNodesFolder, "TestPack"), { recursive: true });
    await writeFile(
      path.join(customNodesFolder, "TestPack", "version.txt"),
      "old"
    );
    const archive = zipSync({ "version.txt": strToU8("new") });
    await writeFile(path.join(customNodesFolder, "TestPack.zip"), archive);
    requirement = {
      name: "TestNode",
      url: "https://github.com/example/TestPack",
      installKind: "node",
      status: "missing",
      downloadUrl: "https://example.test/TestPack.zip",
      downloadSha256: createHash("sha256").update(archive).digest("hex"),
      archiveStripRoot: false
    };
  });
  afterEach(async () => {
    await rm(comfyDirectory, { recursive: true, force: true });
  });

  it("asks before touching an installed pack", async () => {
    await expect(
      downloadSetupRequirementIntoFolder(requirement, customNodesFolder)
    ).rejects.toBeInstanceOf(NodePackAlreadyInstalledError);
    await expect(
      readFile(path.join(customNodesFolder, "TestPack", "version.txt"), "utf8")
    ).resolves.toBe("old");
  });

  it("swaps in the pinned pack and keeps the old one in ComfyUI/backups once confirmed", async () => {
    await downloadSetupRequirementIntoFolder(
      requirement,
      customNodesFolder,
      undefined,
      { replaceExistingNodePack: true }
    );

    await expect(
      readFile(path.join(customNodesFolder, "TestPack", "version.txt"), "utf8")
    ).resolves.toBe("new");
    const backups = await readdir(path.join(comfyDirectory, "backups"));
    const backupOfOldPack = backups.find((name) =>
      name.startsWith("TestPack-")
    );
    expect(backupOfOldPack).toBeDefined();
    await expect(
      readFile(
        path.join(comfyDirectory, "backups", backupOfOldPack!, "version.txt"),
        "utf8"
      )
    ).resolves.toBe("old");
  });
});
