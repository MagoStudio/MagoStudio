import { UPSCALE_MODELS } from "@models/video/constants";
import { ModelCategory, VideoModelDefinition } from "@models/video/types";
import { describe, expect, it } from "vitest";

import {
  getSelectablePlanVideoModels,
  groupPlanVideoModelsByCategory
} from "./getSelectablePlanVideoModels";

describe("getSelectablePlanVideoModels", () => {
  it("never returns hidden or deprecated models", () => {
    const models = getSelectablePlanVideoModels(true);
    for (const model of models) {
      expect(model.status).not.toBe("hidden");
      expect(model.status).not.toBe("deprecated");
    }
  });

  it("includes upscale models", () => {
    const modelNames = getSelectablePlanVideoModels(true).map(
      (model) => model.name
    );
    for (const upscaleEngine of UPSCALE_MODELS) {
      expect(modelNames).toContain(upscaleEngine);
    }
  });

  it("groups upscale models under the UPSCALE category so they render in the dropdown", () => {
    const groups = groupPlanVideoModelsByCategory(
      getSelectablePlanVideoModels(true)
    );
    const upscaleGroup = groups.find(
      (group) => group.key === ModelCategory.UPSCALE
    );
    expect(upscaleGroup).toBeDefined();
    const groupedNames = upscaleGroup?.models.map((model) => model.name) ?? [];
    for (const upscaleEngine of UPSCALE_MODELS) {
      expect(groupedNames).toContain(upscaleEngine);
    }
  });

  it("hides team-only models from non-team users", () => {
    const models = getSelectablePlanVideoModels(false);
    for (const model of models) {
      expect(model.status).not.toBe("team_only");
    }
  });

  it("returns a superset for team members", () => {
    const general = getSelectablePlanVideoModels(false);
    const team = getSelectablePlanVideoModels(true);
    expect(team.length).toBeGreaterThanOrEqual(general.length);
  });
});

const model = (
  name: string,
  category: ModelCategory | undefined
): VideoModelDefinition =>
  ({ name, category }) as unknown as VideoModelDefinition;

describe("groupPlanVideoModelsByCategory", () => {
  it("groups models under their category in MODEL_CATEGORY_ORDER", () => {
    const groups = groupPlanVideoModelsByCategory([
      model("a", ModelCategory.STYLIZATION),
      model("b", ModelCategory.TRANSFORMATION_VFX),
      model("c", ModelCategory.STYLIZATION)
    ]);

    expect(groups.map((g) => g.key)).toEqual([
      ModelCategory.TRANSFORMATION_VFX,
      ModelCategory.STYLIZATION
    ]);
    expect(groups[1].models.map((m) => m.name)).toEqual(["a", "c"]);
  });

  it("drops models without a category", () => {
    const groups = groupPlanVideoModelsByCategory([
      model("a", undefined),
      model("b", ModelCategory.PRIVATE)
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].models.map((m) => m.name)).toEqual(["b"]);
  });

  it("returns no groups for an empty list", () => {
    expect(groupPlanVideoModelsByCategory([])).toEqual([]);
  });
});
