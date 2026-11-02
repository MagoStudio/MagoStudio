import { RENDER_MODELS } from "@models/video/constants";
import {
  MODEL_CATEGORY_ORDER,
  ModelCategory,
  VideoEngine,
  VideoModelDefinition
} from "@models/video/types";

export interface VideoModelCategoryGroup {
  key: ModelCategory;
  models: VideoModelDefinition[];
}

const PLAN_EXCLUDED_ENGINES = new Set<VideoEngine>([
  VideoEngine.V2_5_0,
  VideoEngine.V5_1_0
]);

export function getSelectablePlanVideoModels(
  isTeamMember: boolean
): VideoModelDefinition[] {
  return RENDER_MODELS.filter((model) => {
    if (PLAN_EXCLUDED_ENGINES.has(model.name)) return false;
    if (model.status === "deprecated") return false;
    if (model.status === "hidden") return false;
    if (model.status === "team_only" && !isTeamMember) return false;
    return true;
  });
}

export function groupPlanVideoModelsByCategory(
  models: VideoModelDefinition[]
): VideoModelCategoryGroup[] {
  const grouped = new Map<ModelCategory, VideoModelDefinition[]>();
  for (const model of models) {
    if (!model.category) continue;
    const existing = grouped.get(model.category) ?? [];
    existing.push(model);
    grouped.set(model.category, existing);
  }
  return MODEL_CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((cat) => ({
    key: cat,
    models: grouped.get(cat)!
  }));
}
