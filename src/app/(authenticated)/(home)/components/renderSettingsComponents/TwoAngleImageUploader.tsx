import { ControlLabel } from "@components/ControlLabel";
import { Text } from "@components/Text";
import { useUploadReferenceImage } from "@domains/asset/useUploadReferenceImage";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { SourceImage, SourceImageType } from "@domains/renders/types";
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

import { ImageUploadSlot } from "./ImageUploadSlot";
import { RenderSettingComponentProps } from "./interface";

const ELEMENT_GROUP_INDEX = 0;

export const TwoAngleImageUploader: React.FC<
  RenderSettingComponentProps<string | undefined>
> = ({
  name,
  secondName,
  label,
  tooltip,
  isDisabled,
  selectedLayer,
  onValueChange,
  specificConfig
}) => {
  const { t } = useTranslation();
  const selectedProjectId = useSelectedProjectId();
  const { sourcesAtom } = useRenderSettingsAtoms();
  const sources = useAtomValue(sourcesAtom);
  const setSources = useSetAtom(sourcesAtom);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [uploadErrors, setUploadErrors] = useState<{
    [key: number]: string;
  }>({});

  const { mutateAsync: uploadReferenceImage, uploadProgress } =
    useUploadReferenceImage();

  const isElementGroupEntry = (entry: SourceImage): boolean =>
    (entry.index ?? 0) === ELEMENT_GROUP_INDEX;

  const declaredRoles = parseSourceImageTypes(specificConfig?.sourceRoles);
  const firstAngleRole = declaredRoles[0];
  const secondAngleRole = declaredRoles[1];

  const firstAngleId = sources.find(
    (entry) => entry.type === firstAngleRole && isElementGroupEntry(entry)
  )?.asset_id;
  const secondAngleId = sources.find(
    (entry) => entry.type === secondAngleRole && isElementGroupEntry(entry)
  )?.asset_id;

  const hasFirst = !!firstAngleId;
  const hasSecond = !!secondAngleId;
  const hasExactlyOneImage =
    (hasFirst && !hasSecond) || (!hasFirst && hasSecond);

  const setElementEntry = (
    elementType: SourceImageType,
    assetId: string | undefined
  ) => {
    const withoutEntry = sources.filter(
      (entry) => !(entry.type === elementType && isElementGroupEntry(entry))
    );
    const nextSources = assetId
      ? [
          ...withoutEntry,
          { asset_id: assetId, type: elementType, index: ELEMENT_GROUP_INDEX }
        ]
      : withoutEntry;
    setSources(nextSources);
  };

  const createUploadHandler =
    (slotIndex: number, elementType: SourceImageType, settingKey: string) =>
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedProjectId) return;

      if (
        specificConfig?.maxFileSizeBytes ||
        specificConfig?.minDimension ||
        specificConfig?.maxDimension
      ) {
        try {
          const { width, height } = await getImageDimensions(file);
          const limitErrorKey = getImageLimitErrorKey(
            file,
            {
              width,
              height
            },
            {
              maxFileSizeBytes:
                specificConfig.maxFileSizeBytes ??
                IMAGE_UPLOAD_LIMITS.maxFileSizeBytes,
              minDimension:
                specificConfig.minDimension ?? IMAGE_UPLOAD_LIMITS.minDimension,
              maxDimension:
                specificConfig.maxDimension ?? IMAGE_UPLOAD_LIMITS.maxDimension
            }
          );
          if (limitErrorKey) {
            const overrideKey =
              limitErrorKey === "upload_button_image_input_too_small"
                ? specificConfig.errorKeyTooSmall
                : specificConfig.errorKeyTooBig;
            setUploadErrors((prev) => ({
              ...prev,
              [slotIndex]: translateErrorMessage(
                overrideKey || limitErrorKey,
                t
              )
            }));
            setUploadingSlot(null);
            return;
          }
        } catch (error) {
          console.error("Failed to read image dimensions:", error);
          setUploadErrors((prev) => ({
            ...prev,
            [slotIndex]: translateErrorMessage(
              "upload_button_file_read_error",
              t
            )
          }));
          setUploadingSlot(null);
          return;
        }
      }
      setUploadingSlot(slotIndex);
      setUploadErrors((prev) => {
        const { [slotIndex]: _, ...rest } = prev;
        return rest;
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
          return;
        }

        setElementEntry(elementType, assetId);
        onValueChange?.(settingKey, assetId);
        setUploadingSlot(null);
      } catch (error) {
        console.error(`Error uploading angle ${slotIndex}:`, error);
        setUploadErrors((prev) => ({
          ...prev,
          [slotIndex]: translateErrorMessage(getUploadErrorMessage(error), t)
        }));
        setUploadingSlot(null);
      }
    };
  const handleFirstAngleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    await createUploadHandler(0, firstAngleRole, name)(e);
  };
  const handleSecondAngleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    await createUploadHandler(1, secondAngleRole, secondName || "")(e);
  };

  const handleFirstAngleDelete = () => {
    setElementEntry(firstAngleRole, undefined);
  };
  const handleSecondAngleDelete = () => {
    setElementEntry(secondAngleRole, undefined);
  };
  const handleClearError = (index: number) => {
    setUploadErrors((prev) => {
      const { [index]: _, ...rest } = prev;
      return rest;
    });
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="group">
        <ControlLabel
          label={label}
          labelColor="glyph-tertiary"
          tooltip={tooltip}
        />
      </div>
      <div className="border border-glyph-disabled rounded-lg px-4 py-3">
        <div className="grid grid-cols-2 gap-3">
          <ImageUploadSlot
            assetId={firstAngleId}
            onUpload={handleFirstAngleUpload}
            onDelete={handleFirstAngleDelete}
            isDisabled={isDisabled}
            uploadProgress={uploadingSlot === 0 ? uploadProgress : undefined}
            uploadError={uploadErrors[0]}
            onClearError={() => handleClearError(0)}
            centerLabel={t("titles.reference_image_slot.first_angle")}
            fileNameKeepStart={4}
            fileNameKeepEnd={2}
          />
          <ImageUploadSlot
            assetId={secondAngleId}
            onUpload={handleSecondAngleUpload}
            onDelete={handleSecondAngleDelete}
            isDisabled={isDisabled}
            uploadProgress={uploadingSlot === 1 ? uploadProgress : undefined}
            uploadError={uploadErrors[1]}
            onClearError={() => handleClearError(1)}
            centerLabel={t("titles.reference_image_slot.second_angle")}
            fileNameKeepStart={4}
            fileNameKeepEnd={2}
          />
        </div>
        {hasExactlyOneImage && (
          <Text variant="2xs" color="glyph-error">
            {t("notifications.two_angle_uploader_missing_image.description")}
          </Text>
        )}
        {hasFirst && hasSecond && (
          <Text variant="2xs" color="glyph-tertiary">
            {t("titles.reference_image_slot.elementTag", {
              number: 1
            })}
          </Text>
        )}
      </div>
    </div>
  );
};
