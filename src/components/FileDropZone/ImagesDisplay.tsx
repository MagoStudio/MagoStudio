import { useImageAssets } from "@domains/asset/useImageAssets";
import { truncateFileNameFixed } from "@home/components/fileUpload/helpers/truncateFileName";
import React from "react";

import { ImageThumbnail } from "../ImageThumbnail";
import { Text } from "../Text";

import { FileDropZoneSize } from "./getFileDropZoneLayout";

type Props = {
  assetIds: string[];
  onDeleteImage?: (assetId: string) => void;
  size?: FileDropZoneSize;
  isReadOnly?: boolean;
};

const DEFAULT_MAX_FILENAME_LENGTH = 15;
export const ImagesDisplay: React.FC<Props> = ({
  assetIds,
  onDeleteImage,
  size = "medium",
  isReadOnly = false
}) => {
  const { data: imageAssetsData } = useImageAssets({ assetIds });

  const showsFileName = size === "medium";

  const handleDeleteImage = (assetId: string) => {
    onDeleteImage?.(assetId);
  };

  const imgsSrc = imageAssetsData.map((imageAsset) => ({
    src: imageAsset?.urlToUse ?? "",
    assetId: imageAsset?.asset.id ?? "",
    name: imageAsset?.asset.name ?? ""
  }));

  if (isReadOnly) {
    return (
      <>
        {imgsSrc.map(({ src, assetId, name }) => (
          <ImageThumbnail
            key={assetId}
            src={src}
            alt={name}
            name={name}
            isReadOnly
            imageObjectFit="cover"
            classNames={{ root: "h-[114px] w-[114px] flex-none opacity-50" }}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {imgsSrc.map(({ src, assetId, name }) => (
        <div
          key={assetId}
          className={showsFileName ? "flex flex-col gap-2" : "h-full"}
        >
          <ImageThumbnail
            src={src}
            alt={name}
            name={name}
            onDelete={() => handleDeleteImage(assetId)}
            classNames={showsFileName ? undefined : { root: "h-full w-full" }}
          />
          {showsFileName && (
            <Text color="glyph-tertiary" variant="xs">
              {truncateFileNameFixed(name, DEFAULT_MAX_FILENAME_LENGTH, 0)}
            </Text>
          )}
        </div>
      ))}
    </>
  );
};
