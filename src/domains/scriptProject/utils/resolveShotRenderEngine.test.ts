import { describe, expect, it } from "vitest";

import {
  NEW_PROJECT_SHOT_RENDER_ENGINE,
  SHOT_RENDER_ENGINES,
  UNRECORDED_RENDER_SHOT_RENDER_ENGINE
} from "../constants";

import { resolveShotRenderEngine } from "./resolveShotRenderEngine";

describe("resolveShotRenderEngine", () => {
  it.each(SHOT_RENDER_ENGINES)("preserves local engine %s", (engine) => {
    expect(resolveShotRenderEngine(engine, "local")).toBe(engine);
  });
  it("keeps the legacy default on local projects", () => {
    expect(resolveShotRenderEngine(undefined, "local")).toBe(
      UNRECORDED_RENDER_SHOT_RENDER_ENGINE
    );
  });
  it.each([undefined, UNRECORDED_RENDER_SHOT_RENDER_ENGINE])(
    "uses the new cloud default for %s",
    (engine) => {
      expect(resolveShotRenderEngine(engine, "cloud")).toBe(
        NEW_PROJECT_SHOT_RENDER_ENGINE
      );
    }
  );
  it("keeps selectable cloud engines", () => {
    expect(resolveShotRenderEngine("seedance_2_5", "cloud")).toBe(
      "seedance_2_5"
    );
  });
});
