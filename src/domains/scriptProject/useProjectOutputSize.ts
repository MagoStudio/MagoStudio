import { resolveMiniMaxH3StepLoraSteps } from "../../../desktop/shared/minimaxH3StepLoras";

import {
  DEFAULT_LOCAL_H3_LEGACY_WORKFLOW,
  DEFAULT_LOCAL_H3_MODEL,
  DEFAULT_LOCAL_H3_TEXT_ENCODER,
  DEFAULT_SHOT_DURATION_SECONDS,
  DEFAULT_SHOT_RETRIES,
  LOCAL_H3_MODEL_OPTIONS,
  LOCAL_H3_TEXT_ENCODER_OPTIONS,
  LocalH3Steps,
  LocalH3Model,
  LocalH3TextEncoder
} from "./constants";
import { useSaveProjectSettingsPatch } from "./useSaveProjectSettingsPatch";
import { DEFAULT_OUTPUT_SIZE } from "./utils/buildOutputSize";
import { snapShotSecondsToFrames } from "./utils/snapShotFrames";

/** The size every render in this project uses, and the one control that changes it.
 *
 * Stored as `settings.output_size` because that is what the backend already falls back to when a
 * generate call omits one — so the panel and the render cannot disagree. */
export const useProjectOutputSize = (projectId: string | undefined) => {
  const { project, saveProjectSettingsPatch, isSavingProjectSettings } =
    useSaveProjectSettingsPatch(projectId);

  const storedOutputSize = project?.settings?.output_size;
  const outputSize: [number, number] =
    storedOutputSize && storedOutputSize.length === 2
      ? [storedOutputSize[0]!, storedOutputSize[1]!]
      : DEFAULT_OUTPUT_SIZE;

  const shotFrames =
    project?.settings?.shot_frames ??
    snapShotSecondsToFrames(DEFAULT_SHOT_DURATION_SECONDS);

  const shotQualityRetries =
    project?.settings?.shot_quality_retries ?? DEFAULT_SHOT_RETRIES;

  const localH3Steps: LocalH3Steps = resolveMiniMaxH3StepLoraSteps(
    project?.settings?.local_h3_steps
  );
  const localH3LegacyWorkflow =
    project?.settings?.local_h3_legacy_workflow ??
    DEFAULT_LOCAL_H3_LEGACY_WORKFLOW;
  const storedLocalH3TextEncoder = project?.settings?.local_h3_text_encoder;
  const localH3TextEncoder: LocalH3TextEncoder =
    LOCAL_H3_TEXT_ENCODER_OPTIONS.includes(
      storedLocalH3TextEncoder as LocalH3TextEncoder
    )
      ? (storedLocalH3TextEncoder as LocalH3TextEncoder)
      : DEFAULT_LOCAL_H3_TEXT_ENCODER;
  const storedLocalH3Model = project?.settings?.local_h3_model;
  const localH3Model: LocalH3Model = LOCAL_H3_MODEL_OPTIONS.includes(
    storedLocalH3Model as LocalH3Model
  )
    ? (storedLocalH3Model as LocalH3Model)
    : DEFAULT_LOCAL_H3_MODEL;

  return {
    outputSize,
    shotFrames,
    setOutputSize: (nextOutputSize: [number, number]) =>
      saveProjectSettingsPatch({ output_size: nextOutputSize }),
    setShotFrames: (nextShotFrames: number) =>
      saveProjectSettingsPatch({ shot_frames: nextShotFrames }),
    shotQualityRetries,
    setShotQualityRetries: (nextRetries: number) =>
      saveProjectSettingsPatch({ shot_quality_retries: nextRetries }),
    localH3Steps,
    setLocalH3Steps: (nextSteps: LocalH3Steps) =>
      saveProjectSettingsPatch({ local_h3_steps: nextSteps }),
    localH3LegacyWorkflow,
    setLocalH3LegacyWorkflow: (enabled: boolean) =>
      saveProjectSettingsPatch({ local_h3_legacy_workflow: enabled }),
    localH3TextEncoder,
    setLocalH3TextEncoder: (encoder: LocalH3TextEncoder) =>
      saveProjectSettingsPatch({ local_h3_text_encoder: encoder }),
    localH3Model,
    setLocalH3Model: (model: LocalH3Model) =>
      saveProjectSettingsPatch({ local_h3_model: model }),
    isSavingOutputSize: isSavingProjectSettings
  };
};
