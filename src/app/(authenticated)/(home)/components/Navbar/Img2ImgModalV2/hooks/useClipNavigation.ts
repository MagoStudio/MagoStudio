import { useProject } from "@domains/project/useProject";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { Clip } from "@schemas/clip";
import { useState } from "react";

import { getClipSourceFrame } from "./utils/getClipSourceFrame";

type UseClipNavigationParams = {
  index: number;
  generationIndex: number;
  allClips: Clip[];
};

export const useClipNavigation = ({
  index,
  generationIndex,
  allClips
}: UseClipNavigationParams) => {
  const selectedProjectId = useSelectedProjectId();
  const { data: project } = useProject(selectedProjectId);
  const [currentClipIndex, setCurrentClipIndex] = useState(index);
  const [lastIndexProp, setLastIndexProp] = useState(index);

  if (index !== lastIndexProp) {
    setLastIndexProp(index);
    setCurrentClipIndex(index);
  }

  const currentClip = allClips[currentClipIndex];

  const assetId = currentClip?.asset_id;
  const clipId = currentClip?.id;
  const clipStatus = currentClip?.data?.status;
  const sourceFrame = getClipSourceFrame(currentClip?.data);
  const inputImageId = currentClip?.data?.settings?.input_image_id as
    | string
    | undefined;
  const inputImageUrl = currentClip?.data?.settings?.input_image as
    | string
    | undefined;
  const drawnMaskImageId = currentClip?.data?.settings?.drawn_mask_image_id as
    | string
    | undefined;

  const downloadDisplayName = `frame_${sourceFrame}_${generationIndex + 1}`;
  const filename = project?.name
    ? `${project?.name}_${downloadDisplayName}.jpg`
    : `${downloadDisplayName}.jpg`;

  const onNavigatePrev = () => {
    if (currentClipIndex === 0) return;
    setCurrentClipIndex(currentClipIndex - 1);
  };

  const onNavigateNext = () => {
    if (currentClipIndex === allClips.length - 1) return;
    setCurrentClipIndex(currentClipIndex + 1);
  };

  const canNavigatePrev = currentClipIndex > 0;
  const canNavigateNext = currentClipIndex < allClips.length - 1;

  return {
    currentClip,
    currentClipIndex,
    assetId,
    clipId,
    clipStatus,
    sourceFrame,
    inputImageId,
    inputImageUrl,
    drawnMaskImageId,
    filename,
    project,
    canNavigatePrev,
    canNavigateNext,
    onNavigatePrev,
    onNavigateNext
  };
};
