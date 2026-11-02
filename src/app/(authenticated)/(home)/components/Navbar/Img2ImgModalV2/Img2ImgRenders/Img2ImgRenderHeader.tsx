import { Text } from "@components/Text";
import { useImageAsset } from "@domains/asset/useImageAsset";
import { Img2ImgRenderStatus } from "@models/img2img/types";
import React from "react";
import { useIntersectionObserver } from "usehooks-ts";

import { formatTimestamp } from "../Img2imgModalHistory/helpers/formatTimestamp";

type Props = {
  assetId: string | undefined;
  clipStatus: string | undefined;
  sourceFrame: number | undefined;
  generationIndex: number;
  renderModel: string | undefined;
};

export const Img2ImgRenderHeader: React.FC<Props> = ({
  assetId,
  clipStatus,
  sourceFrame,
  generationIndex,
  renderModel
}) => {
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin: "100px"
  });
  const { data: assetImageResponse } = useImageAsset({
    assetId,
    enabled: isIntersecting && clipStatus === Img2ImgRenderStatus.SUCCESS
  });

  const formattedTimestamp = formatTimestamp(
    assetImageResponse?.asset?.created_at
  );

  return (
    <div ref={ref} className="flex items-center gap-2 overflow-hidden">
      <Text
        className="whitespace-nowrap text-ellipsis overflow-hidden"
        component="span"
        variant="sm"
        color="glyph-secondary"
      >
        {`${sourceFrame}_${generationIndex + 1}`}
      </Text>
      {renderModel && (
        <Text
          component="span"
          variant="sm"
          color="glyph-tertiary"
          className="whitespace-nowrap"
          data-testid="render-model-label"
        >
          {renderModel}
        </Text>
      )}
      <Text
        component="time"
        variant="sm"
        color="glyph-tertiary"
        select="none"
        className="whitespace-nowrap"
      >
        {formattedTimestamp}
      </Text>
    </div>
  );
};
