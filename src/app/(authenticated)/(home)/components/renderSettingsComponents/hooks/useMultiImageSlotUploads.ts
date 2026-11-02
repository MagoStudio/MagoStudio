import { useUploadReferenceImage } from "@domains/asset/useUploadReferenceImage";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { SourceImageType } from "@domains/renders/types";
import { parseSourceImageTypes } from "@domains/renders/utils/parseSourceImageTypes";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import {
  getImageDimensions,
  getUploadErrorMessage,
  translateErrorMessage
} from "@utils";
import {
  getImageLimitErrorKey,
  IMAGE_UPLOAD_LIMITS
} from "@utils/image/imageUploadLimits";
import { useAtomValue, useSetAtom } from "jotai";
import { ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { RenderSettingComponentProps } from "../interface";

const DEFAULT_MAX_SLOTS = 2;
const DEFAULT_ROLE: SourceImageType = "reference_frame";

export const useMultiImageSlotUploads = ({
  name,
  selectedLayer,
  onValueChange,
  specificConfig
}: Pick<
  RenderSettingComponentProps<string[] | undefined>,
  "name" | "selectedLayer" | "onValueChange" | "specificConfig"
>) => {
  const { t } = useTranslation();
  const selectedProjectId = useSelectedProjectId();
  const { sourcesAtom } = useRenderSettingsAtoms();
  const sources = useAtomValue(sourcesAtom);
  const setSources = useSetAtom(sourcesAtom);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [uploadErrors, setUploadErrors] = useState<{ [key: number]: string }>(
    {}
  );

  const { mutateAsync: uploadReferenceImage, uploadProgress } =
    useUploadReferenceImage();

  const role =
    parseSourceImageTypes(specificConfig?.sourceRoles)[0] ?? DEFAULT_ROLE;
  const maxSlots = specificConfig?.maxImageSlots ?? DEFAULT_MAX_SLOTS;
  const fillAllEmptySlots = specificConfig?.fillAllEmptySlots ?? false;
  const roleEntries = sources.filter((entry) => entry.type === role);
  const imageIds = roleEntries.map((entry) => entry.asset_id);
  const emptySlotCount = fillAllEmptySlots
    ? Math.max(0, maxSlots - imageIds.length)
    : imageIds.length < maxSlots
      ? 1
      : 0;

  const getFileLimitErrorMessage = async (
    file: File
  ): Promise<string | null> => {
    const hasCustomLimits =
      specificConfig?.maxFileSizeBytes ||
      specificConfig?.minDimension ||
      specificConfig?.maxDimension;
    if (!hasCustomLimits) return null;
    try {
      const { width, height } = await getImageDimensions(file);
      const limits = {
        maxFileSizeBytes:
          specificConfig.maxFileSizeBytes ??
          IMAGE_UPLOAD_LIMITS.maxFileSizeBytes,
        minDimension:
          specificConfig.minDimension ?? IMAGE_UPLOAD_LIMITS.minDimension,
        maxDimension:
          specificConfig.maxDimension ?? IMAGE_UPLOAD_LIMITS.maxDimension
      };
      const limitErrorKey = getImageLimitErrorKey(
        file,
        { width, height },
        limits
      );
      if (!limitErrorKey) return null;
      const overrideKey =
        limitErrorKey === "upload_button_image_input_too_small"
          ? specificConfig.errorKeyTooSmall
          : specificConfig.errorKeyTooBig;
      return translateErrorMessage(overrideKey || limitErrorKey, t);
    } catch (error) {
      console.error("Failed to read image dimensions:", error);
      return translateErrorMessage("upload_button_file_read_error", t);
    }
  };

  const handleSlotUpload =
    (_index: number) => async (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0 || !selectedProjectId) return;

      let currentSources = sources;
      let currentRoleCount = currentSources.filter(
        (entry) => entry.type === role
      ).length;

      for (const file of files) {
        if (currentRoleCount >= maxSlots) break;

        const slotIndex = currentRoleCount;

        const limitError = await getFileLimitErrorMessage(file);
        if (limitError !== null) {
          setUploadErrors((prev) => ({ ...prev, [slotIndex]: limitError }));
          continue;
        }

        setUploadingSlot(slotIndex);
        setUploadErrors((prev) => {
          const updated = { ...prev };
          delete updated[slotIndex];
          return updated;
        });

        try {
          const assetId = await uploadReferenceImage({
            file,
            selectedLayerId: selectedLayer?.id,
            projectId: selectedProjectId
          });

          if (!assetId) {
            setUploadErrors((prev) => ({
              ...prev,
              [slotIndex]: translateErrorMessage(
                "upload_button_file_corrupted",
                t
              )
            }));
            setUploadingSlot(null);
            continue;
          }

          currentSources = [
            ...currentSources,
            { asset_id: assetId, type: role }
          ];
          currentRoleCount += 1;
          setSources(currentSources);
          onValueChange?.(
            name,
            currentSources
              .filter((entry) => entry.type === role)
              .map((entry) => entry.asset_id)
          );
          setUploadingSlot(null);
        } catch (error) {
          console.error("Error uploading image:", error);
          setUploadErrors((prev) => ({
            ...prev,
            [slotIndex]: translateErrorMessage(getUploadErrorMessage(error), t)
          }));
          setUploadingSlot(null);
        }
      }
    };

  const handleImageDelete = (index: number) => {
    const entryToRemove = roleEntries[index];
    if (!entryToRemove) return;
    const nextSources = sources.filter((entry) => entry !== entryToRemove);
    setSources(nextSources);
    onValueChange?.(
      name,
      nextSources
        .filter((entry) => entry.type === role)
        .map((entry) => entry.asset_id)
    );
  };

  const handleClearError = (index: number) => {
    setUploadErrors((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  return {
    imageIds,
    emptySlotCount,
    uploadingSlot,
    uploadProgress,
    uploadErrors,
    handleSlotUpload,
    handleImageDelete,
    handleClearError
  };
};
