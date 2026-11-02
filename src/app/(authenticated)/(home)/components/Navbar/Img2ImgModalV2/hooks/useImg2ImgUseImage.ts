import { AutoPromptItem, ImageAssetResponse } from "@domains/asset/interface";
import { usePutImageAsset } from "@domains/asset/usePutImageAsset";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { SourceImage } from "@domains/renders/types";
import { toNormalizedCropRectFromWireFields } from "@domains/renders/utils/cropRect";
import { doesModelSupportTagsInPrompt } from "@domains/renders/utils/doesModelSupportTagsInPrompt";
import { SourceImageCrop } from "@domains/renders/utils/getImg2ImgClipCrop";
import { removeSourceEntriesForRoles } from "@domains/renders/utils/removeSourceEntriesForRoles";
import { useTool } from "@hooks/tool/useTool";
import { trackingWithProjectId } from "@hooks/tracking/trackingUtils";
import { getPrimarySourceSlotRole } from "@models/video/utils/getPrimarySourceSlotRole";
import { modelUsesKeyFrameSlot } from "@models/video/utils/modelUsesKeyFrameSlot";
import { sourceRolesFillingPrimarySlot } from "@models/video/utils/sourceRolesFillingPrimarySlot";
import { useIsSettingsEditorOpenAtom } from "@store/atoms";
import { useShotCrop } from "@store/cropStore";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue, useSetAtom } from "jotai";

import { getShotCropOverwriteWarning } from "./utils/getShotCropOverwriteWarning";

const replaceFirstReferenceFrame = (
  sources: SourceImage[],
  assetId: string
): SourceImage[] => {
  const firstReferenceFrameIndex = sources.findIndex(
    (entry) => entry.type === "reference_frame"
  );
  if (firstReferenceFrameIndex === -1) {
    return [{ asset_id: assetId, type: "reference_frame" }, ...sources];
  }
  return sources.map((entry, entryIndex) =>
    entryIndex === firstReferenceFrameIndex
      ? { asset_id: assetId, type: "reference_frame" as const }
      : entry
  );
};

type UseImg2ImgUseImageParams = {
  assetId: string | undefined;
  sourceFrame: number | undefined;
  assetImageResponse: ImageAssetResponse | undefined;
  imageCrop?: SourceImageCrop;
};

export const useImg2ImgUseImage = ({
  assetId,
  sourceFrame,
  assetImageResponse,
  imageCrop
}: UseImg2ImgUseImageParams) => {
  const selectedProjectId = useSelectedProjectId();
  const setIsTrackSettingsDrawerOpen = useSetAtom(
    useIsSettingsEditorOpenAtom()
  );
  const { setTool } = useTool();
  const {
    updateValueAtom,
    selectedModelAtom,
    renderSettingsValuesAtom,
    sourcesAtom
  } = useRenderSettingsAtoms();
  const updateValue = useSetAtom(updateValueAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const renderSettingsValues = useAtomValue(renderSettingsValuesAtom);
  const sources = useAtomValue(sourcesAtom);
  const setSources = useSetAtom(sourcesAtom);
  const { mutate: putImageAsset } = usePutImageAsset({
    assetId: assetId ?? ""
  });
  const { crop: shotCrop, setCrop, clearCrop } = useShotCrop();

  const usedImageCropRect = toNormalizedCropRectFromWireFields(imageCrop);
  const shotCropOverwriteWarning = getShotCropOverwriteWarning({
    shotCrop,
    usedImageCropRect
  });

  const outputUrl = assetImageResponse?.urlToUse || "";

  const supportsTagsInPrompt = doesModelSupportTagsInPrompt(selectedModel.name);
  const handleUseImage = async () => {
    if (!outputUrl || !assetId || !selectedProjectId) return;
    try {
      if (usedImageCropRect) {
        setCrop(usedImageCropRect);
      } else {
        clearCrop();
      }
      if (supportsTagsInPrompt) {
        setSources(replaceFirstReferenceFrame(sources, assetId));

        const currentPrompt = (renderSettingsValues.prompt as string) || "";
        const hasImage1Tag = currentPrompt.toLowerCase().includes("@image1");

        if (!hasImage1Tag) {
          const newPrompt = currentPrompt
            ? `${currentPrompt.trim()} @Image1`
            : "@Image1";
          updateValue({
            key: "prompt",
            value: newPrompt,
            preservePreset: true
          });
        }
      } else {
        const autoPromptArray = assetImageResponse?.asset?.data?.auto_prompt;

        const fullPromptData = autoPromptArray?.find(
          (item: AutoPromptItem) => item.version === "video2video_default"
        );

        const existingPrompt =
          fullPromptData?.positive_prompt ||
          assetImageResponse?.asset?.data?.prompt?.positive?.content;

        if (existingPrompt) {
          updateValue({
            key: "prompt",
            value: existingPrompt,
            preservePreset: true
          });
        }
        if (sourceFrame !== undefined) {
          updateValue({
            key: "keyframe_index",
            value: sourceFrame,
            preservePreset: true
          });
          updateValue({
            key: "keyframe_index_asset_id",
            value: assetId,
            preservePreset: true
          });
        }
        if (modelUsesKeyFrameSlot(selectedModel)) {
          const keyFrameSlotRole =
            getPrimarySourceSlotRole(selectedModel) ?? "key_frame";
          const keyFrameIndex =
            sourceFrame ??
            (typeof renderSettingsValues.keyframe_index === "number"
              ? renderSettingsValues.keyframe_index
              : 0);
          const withoutKeyFrameSlotRole = removeSourceEntriesForRoles(
            sources,
            sourceRolesFillingPrimarySlot(selectedModel)
          );
          const newKeyFrameSlotEntry =
            keyFrameSlotRole === "key_frame"
              ? {
                  asset_id: assetId,
                  type: "key_frame" as const,
                  index: keyFrameIndex,
                  ...imageCrop
                }
              : { asset_id: assetId, type: keyFrameSlotRole, ...imageCrop };
          setSources([newKeyFrameSlotEntry, ...withoutKeyFrameSlotRole]);
        } else {
          const withoutReference = sources.filter(
            (entry) => entry.type !== "reference_frame"
          );
          setSources([
            { asset_id: assetId, type: "reference_frame", ...imageCrop },
            ...withoutReference
          ]);
        }
      }
      setTool("render-video");
      putImageAsset({
        rate: 2
      });
      setIsTrackSettingsDrawerOpen(true);
      trackingWithProjectId.renderActions.img2imgUsedInProject(
        selectedProjectId
      );
    } catch (error) {
      console.error("Error using image:", error);
    }
  };
  return {
    handleUseImage,
    shotCropOverwriteWarning
  };
};
