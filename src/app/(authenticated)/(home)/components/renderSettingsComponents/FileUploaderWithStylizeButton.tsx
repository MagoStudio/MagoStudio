import { ControlLabel } from "@components/ControlLabel";
import { GhostButton } from "@components/GhostButton";
import { InfoBlock } from "@components/InfoBlock";
import { Input } from "@components/Input";
import { Switcher } from "@components/Switcher";
import { Text } from "@components/Text";
import { useImageAsset } from "@domains/asset/useImageAsset";
import { useUploadReferenceImage } from "@domains/asset/useUploadReferenceImage";
import { getAssetDimensions } from "@domains/asset/utils/getAssetDimensions";
import { findPrimarySlotSourceEntry } from "@domains/renders/utils/findPrimarySlotSourceEntry";
import { getImageSourceCropMismatchError } from "@domains/renders/utils/getImageSourceCropMismatchError";
import { isCropCapableEngine } from "@domains/renders/utils/isCropCapableEngine";
import { parseSourceImageTypes } from "@domains/renders/utils/parseSourceImageTypes";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { SourcesDndContainer } from "@home/components/sources/SourcesDndContainer";
import { useTool } from "@hooks/tool/useTool";
import { VideoEngine } from "@models/video/types";
import { flattenSettingsGroups } from "@models/video/utils/flattenSettingsGroups";
import { useShotCrop } from "@store/cropStore";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { cn } from "@utils";
import { useAtomValue, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { UploadStyleReferenceImage } from "../SettingsEditor/magov2/UploadStyleReferenceImage";

import { RenderSettingComponentProps } from "./interface";
import { StylizeFrameButton } from "./StylizeFrameButton";

type AspectRatioType = "landscape" | "portrait" | "square";

const getAspectRatioType = (width: number, height: number): AspectRatioType => {
  if (width > height) return "landscape";
  if (height > width) return "portrait";
  return "square";
};

type FrameSelectionMode = "first_frame" | "select_frame";

export const FileUploaderWithStylizeButton: React.FC<
  RenderSettingComponentProps<string | undefined>
> = ({
  label,
  labelCaption,
  tooltip,
  tooltipImage,
  isDisabled,
  specificConfig
}) => {
  const { t } = useTranslation();
  const {
    renderSettingsValuesAtom,
    selectedModelAtom,
    updateValueAtom,
    sourcesAtom
  } = useRenderSettingsAtoms();
  const renderSettingsValues = useAtomValue(renderSettingsValuesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const updateValue = useSetAtom(updateValueAtom);
  const sources = useAtomValue(sourcesAtom);
  const setSources = useSetAtom(sourcesAtom);

  const declaredSourceRoles = parseSourceImageTypes(
    specificConfig?.sourceRoles
  );
  const primarySlotUploadRole = declaredSourceRoles[0] ?? "key_frame";
  const stylizeFrameSource = findPrimarySlotSourceEntry(
    sources,
    declaredSourceRoles.length > 0 ? declaredSourceRoles : ["key_frame"]
  );
  const value = stylizeFrameSource?.asset_id;

  const frameSelectionMode: FrameSelectionMode =
    renderSettingsValues.keyframe_index !== undefined
      ? "select_frame"
      : "first_frame";

  const currentKeyFrameIndex =
    typeof renderSettingsValues.keyframe_index === "number"
      ? renderSettingsValues.keyframe_index
      : 0;

  const { data: imageAssetData, isLoading: isImageAssetLoading } =
    useImageAsset({
      assetId: value,
      enabled: !!value
    });

  const { isPending: isStyleReferenceImageUploading } =
    useUploadReferenceImage();

  const {
    data: { videoTrack, tracks }
  } = useFilteredAndSortedTracks();

  const { crop } = useShotCrop();

  const isKling26MotionControl =
    selectedModel.name === VideoEngine.kling_2_6_motion_control ||
    selectedModel.name === VideoEngine.kling_3_motion_control;

  const { width: videoWidth, height: videoHeight } = getAssetDimensions(
    getTrackAssetData(videoTrack)
  );
  const { width: imageWidth, height: imageHeight } = getAssetDimensions(
    imageAssetData?.asset?.data
  );
  const hasAspectRatioMismatch = (() => {
    if (!isKling26MotionControl) return false;
    if (!videoWidth || !videoHeight || !imageWidth || !imageHeight)
      return false;

    const videoRatioType = getAspectRatioType(videoWidth, videoHeight);
    const imageRatioType = getAspectRatioType(imageWidth, imageHeight);

    return videoRatioType !== imageRatioType;
  })();
  const hasCropMismatchError =
    isCropCapableEngine(selectedModel.name) &&
    getImageSourceCropMismatchError({
      crop,
      inputVideoWidth: videoWidth,
      inputVideoHeight: videoHeight,
      sources,
      tracks: [videoTrack, ...tracks]
    });

  const stylizeButtonLabel =
    specificConfig?.stylizeButtonLabel || t("actions.stylize_frame.label");
  const uploadButtonLabel =
    specificConfig?.uploadButtonLabel || t("actions.upload_my_frame.label");
  const uploadButtonSubtitle = specificConfig?.uploadButtonSubtitle;

  const isLoadingImage =
    isStyleReferenceImageUploading || (!!value && isImageAssetLoading);

  const shouldShowDndContainer =
    (!imageAssetData?.urlToUse && !isLoadingImage) ||
    (!value && !isStyleReferenceImageUploading);

  const { setTool } = useTool();

  const hasKeyframeIndexSetting = flattenSettingsGroups(selectedModel)
    .flatMap((section) => section.settings)
    .some((setting) => setting.key === "keyframe_index");

  const keyframeIndex = renderSettingsValues.keyframe_index;
  const keyframeIndexText =
    typeof keyframeIndex === "number" || typeof keyframeIndex === "string"
      ? String(keyframeIndex)
      : "";

  const onOpenStylizer = () => {
    setTool("edit-frame");
  };

  const frameSelectionOptions = [
    {
      label: t("actions.first_frame.label"),
      value: "first_frame" as const
    },
    {
      label: t("actions.select_frame.label"),
      value: "select_frame" as const
    }
  ];

  const syncKeyFrameIndex = (newIndex: number) => {
    setSources(
      sources.map((entry) =>
        entry === stylizeFrameSource ? { ...entry, index: newIndex } : entry
      )
    );
  };

  const handleFrameSelectionChange = (
    option: (typeof frameSelectionOptions)[0]
  ) => {
    if (option.value === "first_frame") {
      updateValue({
        key: "keyframe_index",
        value: undefined,
        preservePreset: true
      });
      syncKeyFrameIndex(0);
    } else {
      updateValue({
        key: "keyframe_index",
        value: 0,
        preservePreset: true
      });
      syncKeyFrameIndex(0);
    }
  };

  const handleFrameNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.trim() === "") {
      return;
    }

    const parsedValue = parseInt(e.target.value, 10);
    if (Number.isNaN(parsedValue)) {
      return;
    }

    updateValue({
      key: "keyframe_index",
      value: parsedValue,
      preservePreset: true
    });
    syncKeyFrameIndex(parsedValue);
  };

  return (
    <div className={"flex flex-col gap-4"}>
      <div className={"group flex flex-col gap-1"}>
        <ControlLabel
          label={label}
          labelColor="glyph-tertiary"
          tooltip={tooltip}
          tooltipImage={tooltipImage}
        />
        {shouldShowDndContainer && labelCaption && (
          <Text color="glyph-tertiary" select="none" variant="2xs">
            {labelCaption}
          </Text>
        )}
      </div>
      {!shouldShowDndContainer && (
        <div className={"flex gap-1 w-full"}>
          <GhostButton
            className="w-full"
            isDisabled={isDisabled || isStyleReferenceImageUploading}
            onPress={onOpenStylizer}
            type="button"
          >
            {stylizeButtonLabel}
          </GhostButton>
          <SourcesDndContainer
            isDisabled={isDisabled}
            variant="button"
            className="w-full"
            label={uploadButtonLabel}
            subtitle={uploadButtonSubtitle}
            role={primarySlotUploadRole}
            keyFrameIndex={currentKeyFrameIndex}
          />
        </div>
      )}

      {shouldShowDndContainer && (
        <div className={cn("grid grid-cols-2 gap-2")}>
          <StylizeFrameButton
            isDisabled={isDisabled}
            label={stylizeButtonLabel}
          />
          <SourcesDndContainer
            isDisabled={isDisabled}
            label={uploadButtonLabel}
            subtitle={uploadButtonSubtitle}
            role={primarySlotUploadRole}
            keyFrameIndex={currentKeyFrameIndex}
          />
        </div>
      )}
      {!shouldShowDndContainer && hasKeyframeIndexSetting && (
        <div
          className={"flex gap-1 w-full items-start justify-between px-[2px]"}
        >
          <div className="group flex flex-col gap-2">
            <ControlLabel
              label={t("actions.use_this_frame_as.label")}
              labelColor="glyph-tertiary"
              tooltip={t("actions.use_this_frame_as.description")}
              tooltipImage={tooltipImage}
            />
            <Switcher
              options={frameSelectionOptions}
              onOptionClick={handleFrameSelectionChange}
              isOptionSelected={(option) => option.value === frameSelectionMode}
            />
            {frameSelectionMode === "select_frame" && (
              <Input
                type="number"
                value={keyframeIndexText || "0"}
                onChange={handleFrameNumberChange}
                onBlur={(e) => {
                  if (e.target.value.trim() === "") {
                    updateValue({
                      key: "keyframe_index",
                      value: 0,
                      preservePreset: true
                    });
                    syncKeyFrameIndex(0);
                  }
                }}
                disabled={isDisabled}
                endCaption="fr."
                min={0}
                preserveEmptyWhileFocused
              />
            )}
          </div>
          <div className="pt-1">
            <UploadStyleReferenceImage
              isDisabled={isDisabled}
              styleReferenceImageId={value}
              hasCropMismatchError={hasCropMismatchError}
            />
          </div>
        </div>
      )}
      {!shouldShowDndContainer && !hasKeyframeIndexSetting && (
        <div className="pt-1 flex justify-end gap-2">
          {hasAspectRatioMismatch && (
            <InfoBlock variant="warning">
              {t("notifications.aspect_ratio_mismatch_warning.description")}
            </InfoBlock>
          )}
          <UploadStyleReferenceImage
            isDisabled={isDisabled}
            styleReferenceImageId={value}
            hasCropMismatchError={hasCropMismatchError}
          />
        </div>
      )}
    </div>
  );
};
