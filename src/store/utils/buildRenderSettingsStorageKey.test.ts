import { describe, expect, test } from "vitest";

import { buildRenderSettingsStorageKey } from "./buildRenderSettingsStorageKey";

describe("buildRenderSettingsStorageKey", () => {
  test("keys image-to-video on the project only, ignoring the shot id", () => {
    const keyWithShotA = buildRenderSettingsStorageKey({
      userId: "user-1",
      projectId: "project-1",
      shotId: "shot-a",
      mode: "image-to-video"
    });
    const keyWithShotB = buildRenderSettingsStorageKey({
      userId: "user-1",
      projectId: "project-1",
      shotId: "shot-b",
      mode: "image-to-video"
    });
    const keyWithNoShot = buildRenderSettingsStorageKey({
      userId: "user-1",
      projectId: "project-1",
      shotId: "",
      mode: "image-to-video"
    });

    expect(keyWithShotA).toBe("user-1-project-1-image-to-video");
    expect(keyWithShotB).toBe(keyWithShotA);
    expect(keyWithNoShot).toBe(keyWithShotA);
  });

  test("keeps the shot id in the key for the render mode", () => {
    const key = buildRenderSettingsStorageKey({
      userId: "user-1",
      projectId: "project-1",
      shotId: "shot-a",
      mode: "render"
    });

    expect(key).toBe("user-1-project-1-shot-a-render");
  });

  test("keeps the shot id in the key for upscale and mask modes", () => {
    expect(
      buildRenderSettingsStorageKey({
        userId: "user-1",
        projectId: "project-1",
        shotId: "shot-a",
        mode: "upscale"
      })
    ).toBe("user-1-project-1-shot-a-upscale");

    expect(
      buildRenderSettingsStorageKey({
        userId: "user-1",
        projectId: "project-1",
        shotId: "shot-a",
        mode: "mask"
      })
    ).toBe("user-1-project-1-shot-a-mask");
  });

  test("returns undefined before the user resolves", () => {
    expect(
      buildRenderSettingsStorageKey({
        userId: "",
        projectId: "project-1",
        shotId: "shot-a",
        mode: "render"
      })
    ).toBeUndefined();
  });

  test("returns undefined when a shot-scoped mode has no shot id", () => {
    expect(
      buildRenderSettingsStorageKey({
        userId: "user-1",
        projectId: "project-1",
        shotId: undefined,
        mode: "render"
      })
    ).toBeUndefined();
  });

  test("returns undefined when image-to-video has no project id", () => {
    expect(
      buildRenderSettingsStorageKey({
        userId: "user-1",
        projectId: undefined,
        shotId: "shot-a",
        mode: "image-to-video"
      })
    ).toBeUndefined();
  });
});
