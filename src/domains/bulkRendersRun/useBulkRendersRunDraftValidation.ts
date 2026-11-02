import {
  BulkRenderingFirstFrameSource,
  BulkRendersRunDraftMasterSettings
} from "@store/atoms";

import { BulkRenderingDraftShotVideoSettingsState } from "./useBulkRenderingDraftShotVideoSettings";
import { buildBulkRenderingDraftShotVideoSettings } from "./utils/buildBulkRenderingDraftShotVideoSettings";
import { validateBulkRenderingShotSuppliedFirstFrame } from "./utils/validateBulkRenderingShotSuppliedFirstFrame";
import {
  SettingValidationError,
  validateBulkRenderingShotVideoSettings
} from "./utils/validateBulkRenderingShotVideoSettings";

export type { SettingValidationError } from "./utils/validateBulkRenderingShotVideoSettings";

export const useBulkRendersRunDraftValidation = ({
  shotIds,
  masterSettings,
  draftShotVideoSettings,
  firstFrameSource,
  uploadedFirstFrameAssetIdByShotId
}: {
  shotIds: string[];
  masterSettings: BulkRendersRunDraftMasterSettings;
  draftShotVideoSettings: BulkRenderingDraftShotVideoSettingsState;
  firstFrameSource: BulkRenderingFirstFrameSource | undefined;
  uploadedFirstFrameAssetIdByShotId: Record<string, string>;
}): Record<string, SettingValidationError[]> => {
  const errorsByShotId: Record<string, SettingValidationError[]> = {};

  for (const shotId of shotIds) {
    const shotValues = buildBulkRenderingDraftShotVideoSettings({
      masterSettings,
      shotVideoSettingsPatch:
        draftShotVideoSettings.shotVideoSettingsOverrideById[shotId] ?? {}
    });

    const videoSettingsErrors = validateBulkRenderingShotVideoSettings(
      masterSettings.videoModel,
      shotValues
    );
    const suppliedFirstFrameErrors =
      validateBulkRenderingShotSuppliedFirstFrame({
        firstFrameSource,
        hasUploadedFirstFrame: Boolean(
          uploadedFirstFrameAssetIdByShotId[shotId]
        )
      });

    errorsByShotId[shotId] = [
      ...videoSettingsErrors,
      ...suppliedFirstFrameErrors
    ];
  }

  return errorsByShotId;
};
