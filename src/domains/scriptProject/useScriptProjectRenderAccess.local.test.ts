import { describe, expect, it } from "vitest";

import { ProviderPreferences } from "@/platform/providerPreferences";

import { SHEET_RENDER_MODELS } from "./constants";
import {
  canRenderLocalScriptProject,
  canRenderScriptProject
} from "./useScriptProjectRenderAccess.local";

const preferences = (
  overrides: Partial<ProviderPreferences> = {}
): ProviderPreferences => ({
  "local-comfy": true,
  "mago-cloud": true,
  ...overrides
});

describe("canRenderScriptProject", () => {
  it("allows generation only when Mago Cloud is both reachable and enabled", () => {
    expect(canRenderScriptProject(true, preferences())).toBe(true);
    expect(canRenderScriptProject(false, preferences())).toBe(false);
    expect(
      canRenderScriptProject(true, preferences({ "mago-cloud": false }))
    ).toBe(false);
  });

  it("allows local generation only with ComfyUI and the local provider enabled", () => {
    expect(canRenderLocalScriptProject(true, preferences())).toBe(true);
    expect(canRenderLocalScriptProject(false, preferences())).toBe(false);
    expect(
      canRenderLocalScriptProject(true, preferences({ "local-comfy": false }))
    ).toBe(false);
  });
  it.each(SHEET_RENDER_MODELS)(
    "allows %s in a local project with ComfyUI off and the local provider disabled",
    (model) => {
      expect(
        canRenderLocalScriptProject(
          false,
          preferences({ "local-comfy": false }),
          model,
          true
        )
      ).toBe(true);
    }
  );

  it.each(SHEET_RENDER_MODELS)(
    "requires cloud access and the cloud provider for %s even with ComfyUI available",
    (model) => {
      expect(
        canRenderLocalScriptProject(true, preferences(), model, false)
      ).toBe(false);
      expect(
        canRenderLocalScriptProject(
          true,
          preferences({ "mago-cloud": false }),
          model,
          true
        )
      ).toBe(false);
    }
  );
});
