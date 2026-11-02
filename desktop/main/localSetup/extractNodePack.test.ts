import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { zipSync, strToU8 } from "fflate";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { extractNodePack } from "./extractNodePack";
let directory: string;
let archive: string;
let destination: string;
beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "mago-extract-test-"));
  archive = path.join(directory, "pack.zip");
  destination = path.join(directory, "pack");
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});
describe("node pack extraction", () => {
  it("strips the GitHub root folder and installs the pack", async () => {
    await writeFile(
      archive,
      zipSync({
        "pack-main/__init__.py": strToU8("node code"),
        "pack-main/lib/test.py": strToU8("helper")
      })
    );
    await extractNodePack(archive, destination);
    expect(await readFile(path.join(destination, "__init__.py"), "utf8")).toBe(
      "node code"
    );
  });
  it("rejects traversal without writing outside the destination", async () => {
    await writeFile(
      archive,
      zipSync({ "pack-main/../../escape.py": strToU8("bad") })
    );
    await expect(extractNodePack(archive, destination)).rejects.toThrow(
      "Unsafe"
    );
    expect(await readdir(directory)).toEqual(["pack.zip"]);
  });
  it("checks CRC before extracting", async () => {
    const bytes = Buffer.from(
      zipSync({ "pack-main/__init__.py": strToU8("code") })
    );
    const central = bytes.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    bytes.writeUInt32LE(123, central + 16);
    await writeFile(archive, bytes);
    await expect(extractNodePack(archive, destination)).rejects.toThrow("CRC");
    expect(await readdir(directory)).toEqual(["pack.zip"]);
  });
  it("preserves existing node folders", async () => {
    await writeFile(
      archive,
      zipSync({ "pack-main/__init__.py": strToU8("code") })
    );
    await extractNodePack(archive, destination);
    await expect(extractNodePack(archive, destination)).rejects.toThrow(
      "already exists"
    );
  });
});

it("extracts a flat registry archive without stripping package files", async () => {
  await writeFile(
    archive,
    zipSync({
      "__init__.py": strToU8("code"),
      "lib/helper.py": strToU8("helper")
    })
  );
  await extractNodePack(archive, destination, false);
  expect(await readFile(path.join(destination, "__init__.py"), "utf8")).toBe(
    "code"
  );
  expect(await readFile(path.join(destination, "lib/helper.py"), "utf8")).toBe(
    "helper"
  );
});
