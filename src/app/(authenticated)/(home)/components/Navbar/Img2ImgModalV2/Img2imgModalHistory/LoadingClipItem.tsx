/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { Img2ImgRenderStatus } from "@models/img2img/types";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect } from "react";

import { queryKeys } from "@/queryKeys";

import { useGetImg2ImgRenderStatus } from "../hooks/useGetImg2ImgRenderStatus";

import {
  Img2ImgPlaceholderRender,
  Img2ImgPlaceholderVariant
} from "./Img2ImgPlaceholderRender";

type LoadingClipItemProps = {
  clipId: string;
};

const variantForStatus = (
  status: string | undefined
): Img2ImgPlaceholderVariant => {
  if (status === Img2ImgRenderStatus.FAILED) return "failed";
  if (status === Img2ImgRenderStatus.TIMEOUT) return "timeout";
  if (status === Img2ImgRenderStatus.CANCELLED) return "cancelled";
  return "loading";
};

export const LoadingClipItem: React.FC<LoadingClipItemProps> = ({ clipId }) => {
  const queryClient = useQueryClient();
  const selectedProjectId = useSelectedProjectId();
  const { data: renderItemStatusResponse } = useGetImg2ImgRenderStatus({
    clipId
  });
  const progress = renderItemStatusResponse?.progress;
  const renderStatus = renderItemStatusResponse?.render_status;
  const variant = variantForStatus(renderStatus);

  useEffect(() => {
    if (renderStatus === Img2ImgRenderStatus.SUCCESS) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.project.byId(selectedProjectId)
      });
    }
    if (
      renderStatus === Img2ImgRenderStatus.SUCCESS ||
      renderStatus === Img2ImgRenderStatus.FAILED
    ) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.balance.all
      });
    }
  }, [renderStatus, selectedProjectId, queryClient]);

  return (
    <div
      data-testid={
        variant === "loading" ? "img2img-loading-clip" : "img2img-error-clip"
      }
    >
      <Img2ImgPlaceholderRender
        variant={variant}
        clipId={clipId}
        progress={progress}
      />
    </div>
  );
};
