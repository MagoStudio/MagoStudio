import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, expect, it } from "vitest";

import { atomicProduceFile, atomicWriteFile } from "./atomicFile";

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});
it("keeps the previous file when a producer fails midway", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "mago-atomic-"));
  roots.push(root);
  const destination = path.join(root, "output.mp4");
  await writeFile(destination, "previous complete output");
  await expect(
    atomicProduceFile(destination, async (temporary) => {
      await writeFile(temporary, "incomplete");
      throw new Error("Disk full");
    })
  ).rejects.toThrow("Disk full");
  expect(await readFile(destination, "utf8")).toBe("previous complete output");
  expect(await readdir(root)).toEqual(["output.mp4"]);
});
it("publishes one complete file when many writers replace it at once", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "mago-atomic-"));
  roots.push(root);
  const destination = path.join(root, "settings.json");
  const writerIds = Array.from({ length: 20 }, (_, index) => `writer${index}`);
  await Promise.all([
    ...writerIds.map((writerId) =>
      atomicWriteFile(destination, JSON.stringify({ [writerId]: true }))
    ),
    ...writerIds.map((writerId) =>
      atomicProduceFile(destination, (temporary) =>
        writeFile(temporary, JSON.stringify({ [`${writerId}Produced`]: true }))
      )
    )
  ]);
  expect(
    Object.keys(JSON.parse(await readFile(destination, "utf8")))
  ).toHaveLength(1);
  expect(await readdir(root)).toEqual(["settings.json"]);
});
it("publishes complete files without sharing temporary names between writers", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "mago-atomic-"));
  roots.push(root);
  const destination = path.join(root, "settings.json");
  await Promise.all([
    atomicWriteFile(destination, JSON.stringify({ a: "a".repeat(10000) })),
    atomicWriteFile(destination, JSON.stringify({ b: "b".repeat(10000) }))
  ]);
  expect(
    Object.keys(JSON.parse(await readFile(destination, "utf8")))
  ).toHaveLength(1);
  expect(await readdir(root)).toEqual(["settings.json"]);
});
