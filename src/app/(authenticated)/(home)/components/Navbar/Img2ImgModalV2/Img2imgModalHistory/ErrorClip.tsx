import { Img2ImgRenderStatus } from "@models/img2img/types";
import { Clip } from "@schemas/clip";
import React from "react";

import { useGetImg2ImgRenderStatus } from "../hooks/useGetImg2ImgRenderStatus";

import {
  Img2ImgPlaceholderRender,
  Img2ImgPlaceholderVariant
} from "./Img2ImgPlaceholderRender";

type Props = {
  clip: Clip;
};

const variantForStatus = (
  status: string | undefined
): Img2ImgPlaceholderVariant => {
  if (status === Img2ImgRenderStatus.CANCELLED) return "cancelled";
  if (status === Img2ImgRenderStatus.TIMEOUT) return "timeout";
  return "failed";
};

export const ErrorClip: React.FC<Props> = ({ clip }) => {
  const clipId = clip?.id;
  const { data: renderItemStatusResponse } = useGetImg2ImgRenderStatus({
    clipId
  });
  const progress = renderItemStatusResponse?.progress;
  const renderStatus = renderItemStatusResponse?.render_status;

  return (
    <div data-testid="img2img-error-clip">
      <Img2ImgPlaceholderRender
        variant={variantForStatus(renderStatus)}
        clipId={clipId}
        progress={progress}
      />
    </div>
  );
};
