import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { useImageAsset } from "@domains/asset/useImageAsset";
import { Img2ImgRenderStatus } from "@models/img2img/types";
import { Clip } from "@schemas/clip";
import React from "react";

import { useGetImg2ImgRenderStatus } from "../hooks/useGetImg2ImgRenderStatus";
import { getStatusText } from "../utils/getStatusText";

interface Props {
  clip: Clip;
  onClipClick: (generationId: string) => void;
  frameNumber: number;
  index: number;
  isExpanded: boolean;
}

export const ClipListItem: React.FC<Props> = ({
  clip,
  onClipClick,
  frameNumber,
  index,
  isExpanded
}) => {
  const isClipRenderFinished =
    clip.data?.status === Img2ImgRenderStatus.SUCCESS;
  const { data: renderItemStatusResponse } = useGetImg2ImgRenderStatus({
    clipId: clip.id,
    enabled: isClipRenderFinished && isExpanded
  });

  const displayName = `${frameNumber} - ${index + 1}`;

  const status = renderItemStatusResponse?.render_status;
  const progress = renderItemStatusResponse?.progress;

  const { data: assetImageResponse } = useImageAsset({
    assetId: clip.asset_id,
    enabled: clip.data?.status === Img2ImgRenderStatus.SUCCESS && isExpanded
  });
  const displayText =
    status === Img2ImgRenderStatus.SUCCESS
      ? displayName
      : getStatusText({ status, progress });

  return (
    <div
      className="flex items-center justify-between cursor-pointer hover:bg-surface-primary px-2 py-2"
      onClick={() => onClipClick(clip.id)}
    >
      <div className="flex items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2">
          {assetImageResponse?.urlToUse ? (
            <img
              src={assetImageResponse?.urlToUse}
              alt={displayName}
              loading="lazy"
              className="h-6 w-10 bg-gray-700 rounded object-cover"
            />
          ) : (
            <div className="h-6 w-10 bg-surface-bg-300 rounded" />
          )}
          <Text
            component="span"
            variant="sm"
            color="glyph-secondary"
            className="overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {displayText}
          </Text>
        </div>
        {!!assetImageResponse?.asset?.rate &&
          assetImageResponse?.asset?.rate > 0 && (
            <Icon
              iconSet="16-filled"
              iconName="rating"
              className="text-element-in-progress"
            />
          )}
      </div>
    </div>
  );
};
