import { FieldFileDropZone } from "@components/Form/Fields/FieldFileDropZone";
import { ImageThumbnail } from "@components/ImageThumbnail";
import { Text } from "@components/Text";
import { useImageAssets } from "@domains/asset/useImageAssets";
import { useImg2ImgHistoryClips } from "@domains/track/useImg2ImgHistoryClips";
import React, { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  clearIteratedFormValues,
  SET_VALUE_OPTIONS
} from "./hooks/utils/clearIteratedFormValues";
import { getClipSourceFrame } from "./hooks/utils/getClipSourceFrame";
import { Img2ImgType } from "./schemas";

export const Img2ImgFrameUploader: React.FC = ({}) => {
  const { t } = useTranslation();
  const { setValue, trigger } = useFormContext<Img2ImgType>();
  const iteratedAssetId = useWatch<Img2ImgType, "iteratedAssetId">({
    name: "iteratedAssetId"
  });
  const uploadedImageId = useWatch<Img2ImgType, "uploadedImageId">({
    name: "uploadedImageId"
  });
  const { data } = useImg2ImgHistoryClips();
  const sortedClips = data?.sortedClips;

  const iteratingClip = useMemo(() => {
    if (!iteratedAssetId || !sortedClips) return null;
    return sortedClips.find((clip) => clip.asset_id === iteratedAssetId);
  }, [iteratedAssetId, sortedClips]);

  const displayAssetId = iteratedAssetId || uploadedImageId;
  const assetIds = displayAssetId ? [displayAssetId] : [];
  const { data: imageAssetsData } = useImageAssets({ assetIds });
  const imageAsset = imageAssetsData[0];

  const handleDelete = async () => {
    if (iteratedAssetId) {
      clearIteratedFormValues(setValue);
    } else {
      setValue("uploadedImageId", undefined, SET_VALUE_OPTIONS);
    }
    await trigger();
  };

  const handleUploadChange = async (newAssetIds: string[]) => {
    setValue("uploadedImageId", newAssetIds[0] || undefined, SET_VALUE_OPTIONS);
    await trigger();
  };

  if (displayAssetId && imageAsset) {
    const sourceFrame = getClipSourceFrame(iteratingClip?.data);

    return (
      <div className="flex flex-col gap-2">
        {iteratedAssetId && sourceFrame !== undefined && (
          <Text component="span" variant="xs" color="glyph-tertiary">
            {t("img2imgForms.common.iteration_on_frame.label", {
              frameNumber: sourceFrame
            })}
          </Text>
        )}
        <ImageThumbnail
          src={imageAsset.urlToUse}
          name={imageAsset.asset.name}
          alt="Uploaded image"
          onDelete={handleDelete}
          classNames={{
            root: "!aspect-auto h-[200px] w-full !flex-none"
          }}
        />
      </div>
    );
  }

  const uploadedImageValue = uploadedImageId ? [uploadedImageId] : [];

  return (
    <FieldFileDropZone
      name="uploadedImageId"
      text={t("img2imgForms.common.drag_and_drop_stylized_frame.label")}
      maxFileUpload={1}
      value={uploadedImageValue}
      onChange={handleUploadChange}
    />
  );
};
