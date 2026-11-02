import { ShotState } from "@schemas/scriptProject";
import { useState } from "react";

import {
  SceneShotLayout,
  parseSceneShotsFromVideoPrompt
} from "./utils/parseSceneShotsFromVideoPrompt";
import { resolveSceneShotDraftEdits } from "./utils/resolveSceneShotDraftEdits";

type SavedScene = Pick<
  ShotState,
  "timeline_id" | "duration_s" | "video_prompt" | "dialogue"
>;

const buildSavedSceneSignature = (savedScene: SavedScene) =>
  JSON.stringify([
    savedScene.timeline_id,
    savedScene.video_prompt ?? "",
    savedScene.dialogue ?? [],
    savedScene.duration_s ?? null
  ]);

export const useSceneShotLayoutDraft = (shot: SavedScene) => {
  const [sceneShotLayout, setSceneShotLayout] = useState<SceneShotLayout>(() =>
    parseSceneShotsFromVideoPrompt(shot)
  );
  const [seededFromScene, setSeededFromScene] = useState<SavedScene>(shot);

  const hasSavedSceneChanged =
    buildSavedSceneSignature(seededFromScene) !==
    buildSavedSceneSignature(shot);
  if (hasSavedSceneChanged) {
    const hasUnsavedSceneShotEdits =
      Object.keys(
        resolveSceneShotDraftEdits({
          shot: seededFromScene,
          sceneShotLayout
        }).unsavedEdits
      ).length > 0;
    setSeededFromScene(shot);
    if (!hasUnsavedSceneShotEdits)
      setSceneShotLayout(parseSceneShotsFromVideoPrompt(shot));
  }

  return { sceneShotLayout, setSceneShotLayout };
};
