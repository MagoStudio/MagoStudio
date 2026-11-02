import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useBlockRenderWhileLocalSetupRuns } from "@domains/renders/useBlockRenderWhileLocalSetupRuns";
import { RenderMode } from "@hooks/types";
import {
  BulkRendersRunDraftMasterSettings,
  bulkRenderingFlowAtom
} from "@store/atoms";
import { useToast } from "@store/useToast";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { useCreateBulkRendersRun } from "./data/useCreateBulkRendersRun";
import {
  BulkRendersRunShotSettingsOverride,
  buildCreateBulkRendersRunRequest
} from "./utils/buildCreateBulkRendersRunRequest";
import { bulkRunRequiresComfy } from "./utils/bulkRunRequiresComfy";
import { resolveBulkRenderingMasterPrompts } from "./utils/resolveBulkRenderingMasterPrompts";

export const useLaunchBulkRendersRun = ({
  selectedShotIds,
  masterSettings,
  isTeamMember,
  firstFrameSource,
  shotMaxFramesById
}: {
  selectedShotIds: string[];
  masterSettings: BulkRendersRunDraftMasterSettings;
  isTeamMember: boolean;
  firstFrameSource: "generated" | "uploaded";
  shotMaxFramesById: Map<string, number>;
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const selectedProjectId = useSelectedProjectId();
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);
  const { mutateAsync: createBulkRendersRun, isPending: isLaunching } =
    useCreateBulkRendersRun();
  const blockRenderWhileLocalSetupRuns = useBlockRenderWhileLocalSetupRuns();

  const launchBulkRendersRun = async (
    name: string,
    shotSettingsOverrideById: Record<
      string,
      BulkRendersRunShotSettingsOverride
    > = {}
  ) => {
    if (!selectedProjectId || selectedShotIds.length === 0) {
      return;
    }

    const { masterImagePrompt, masterVideoPrompt } =
      resolveBulkRenderingMasterPrompts(masterSettings);

    try {
      const request = buildCreateBulkRendersRunRequest({
        projectId: selectedProjectId,
        selectedShotIds,
        name,
        renderSettingsValues: {
          ...masterSettings.videoSettings,
          prompt: masterVideoPrompt
        },
        videoModel: masterSettings.videoModel,
        renderEngine: masterSettings.videoModel.name,
        renderMode: RenderMode.CREDITS,
        frameRange: masterSettings.frameRange,
        imageSettings: masterSettings.imageSettings,
        imagePrompt: masterImagePrompt,
        imageRenderModel: masterSettings.imageSettings.model,
        imageReferenceAssetIds: masterSettings.imageSettings.referenceImages,
        shotSettingsOverrideById,
        isTeamMember,
        firstFrameSource,
        isFullFrameRangePresetSelected:
          masterSettings.isFullFrameRangePresetSelected,
        shotMaxFramesById
      });

      if (blockRenderWhileLocalSetupRuns(bulkRunRequiresComfy(request))) return;

      const createdRun = await createBulkRendersRun(request);
      setBulkRenderingFlow({ view: "run", bulkRunId: createdRun.id });
    } catch {
      showToast({
        message: t("notifications.bulk_renders_run_launch_failed.description")
      });
    }
  };

  return { launchBulkRendersRun, isLaunching };
};
