import {
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, rename: vi.fn(actual.rename) };
});

import { defaultModelPreferences } from "../../shared/defaultModelPreferences";

import { ModelSettingsStore } from "./ModelSettingsStore";

describe("ModelSettingsStore", () => {
  let directory: string;
  const originalPlatform = Object.getOwnPropertyDescriptor(
    process,
    "platform"
  )!;
  beforeEach(async () => {
    const actual =
      await vi.importActual<typeof import("node:fs/promises")>(
        "node:fs/promises"
      );
    vi.mocked(rename).mockReset().mockImplementation(actual.rename);
    directory = await mkdtemp(path.join(os.tmpdir(), "model-store-"));
  });
  afterEach(async () => {
    Object.defineProperty(process, "platform", originalPlatform);
    await rm(directory, { recursive: true, force: true });
  });
  it("orders reads and updates across store instances for the same file", async () => {
    const file = path.join(directory, "models.json");
    const first = new ModelSettingsStore(file);
    const second = new ModelSettingsStore(
      path.join(directory, ".", "models.json")
    );
    const writes = [
      first.recordProblem("http://a:8188", "text", {
        status: "success",
        message: "first"
      }),
      second.recordProblem("http://a:8188", "minimax", {
        status: "success",
        message: "second"
      })
    ];
    const read = second.endpoint("http://a:8188");
    await Promise.all(writes);
    expect((await read).problems).toMatchObject({
      text: { message: "first" },
      minimax: { message: "second" }
    });
  });
  it("retries temporary Windows rename locks without losing settings", async () => {
    Object.defineProperty(process, "platform", { value: "win32" });
    const file = path.join(directory, "models.json");
    const store = new ModelSettingsStore(file);
    await store.recordProblem("http://a:8188", "text", {
      status: "success",
      message: "existing"
    });
    vi.mocked(rename)
      .mockClear()
      .mockRejectedValueOnce(
        Object.assign(new Error("locked"), { code: "EPERM" })
      )
      .mockRejectedValueOnce(
        Object.assign(new Error("locked"), { code: "EACCES" })
      );
    await store.recordProblem("http://a:8188", "minimax", {
      status: "success",
      message: "new"
    });
    expect(rename).toHaveBeenCalledTimes(3);
    expect((await store.endpoint("http://a:8188")).problems).toMatchObject({
      text: { message: "existing" },
      minimax: { message: "new" }
    });
    expect(await readdir(directory)).toEqual(["models.json"]);
  });
  it("preserves the old file on persistent locks and permits a later retry", async () => {
    Object.defineProperty(process, "platform", { value: "win32" });
    const file = path.join(directory, "models.json");
    const store = new ModelSettingsStore(file);
    await store.recordProblem("http://a:8188", "text", {
      status: "success",
      message: "existing"
    });
    const original = await readFile(file, "utf8");
    vi.mocked(rename)
      .mockClear()
      .mockRejectedValue(Object.assign(new Error("locked"), { code: "EPERM" }));
    await expect(
      store.recordProblem("http://a:8188", "minimax", {
        status: "success",
        message: "new"
      })
    ).rejects.toThrow("locked");
    expect(rename).toHaveBeenCalledTimes(6);
    expect(await readFile(file, "utf8")).toBe(original);
    expect(await readdir(directory)).toEqual(["models.json"]);
    const actual =
      await vi.importActual<typeof import("node:fs/promises")>(
        "node:fs/promises"
      );
    vi.mocked(rename).mockImplementation(actual.rename);
    await store.recordProblem("http://a:8188", "minimax", {
      status: "success",
      message: "retry"
    });
    expect(
      (await store.endpoint("http://a:8188")).problems?.minimax.message
    ).toBe("retry");
  });
  it("serializes concurrent changes without crossing endpoint boundaries", async () => {
    const store = new ModelSettingsStore(path.join(directory, "models.json"));
    await Promise.all([
      store.update("http://a:8188", (old) => ({
        ...old,
        settings: {
          models: { text: defaultModelPreferences("qwen38-27b-q3") },
          memoryPolicy: "auto"
        }
      })),
      store.update("http://b:8188", (old) => ({
        ...old,
        settings: {
          models: { text: defaultModelPreferences("qwen38-27b-q5") },
          memoryPolicy: "low-vram"
        }
      })),
      store.recordProblem("http://a:8188", "text", {
        status: "error",
        message: "GPU allocation failed"
      })
    ]);
    expect(
      (await store.endpoint("http://a:8188")).settings?.models.text?.variant
    ).toBe("qwen38-27b-q3");
    expect(
      (await store.endpoint("http://a:8188")).problems?.text.message
    ).toContain("allocation");
    expect((await store.endpoint("http://b:8188")).settings?.memoryPolicy).toBe(
      "low-vram"
    );
    expect(await store.endpoint("http://new:8188")).toEqual({});
  });
  it("does not overwrite a damaged model settings document", async () => {
    const file = path.join(directory, "models.json");
    await writeFile(file, "not json");
    const store = new ModelSettingsStore(file);
    await expect(
      store.recordProblem("http://a:8188", "text", {
        status: "error",
        message: "x"
      })
    ).rejects.toThrow();
    expect(await readFile(file, "utf8")).toBe("not json");
  });
});
