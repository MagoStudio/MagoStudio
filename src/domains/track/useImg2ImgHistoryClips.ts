import { Clip } from "@schemas/clip";
import { Layer, LayerType } from "@schemas/layer";
import { groupBy } from "lodash";

import { useSelectedShot } from "../shot/useSelectedShot";

export type GridItem =
  | {
      id: string;
      type: "success";
      clipIndex: number;
      generationIndex: number;
    }
  | {
      id: string;
      type: "loading";
      clipId: string;
    }
  | {
      id: string;
      type: "error";
      clip: Clip;
    };
const buildGridItems = (
  clips: Clip[],
  groupedClips: Record<string, Clip[]>
): GridItem[] => {
  const items: GridItem[] = [];

  clips.forEach((clip, index) => {
    const status = clip.data.status;

    if (status === "success") {
      const frame = clip.data.frame;
      if (frame === undefined || !groupedClips[frame]) {
        console.error("Frame not found in grouped clips", {
          frame,
          groupedClips
        });
        return;
      }
      const frameClips = groupedClips[frame];
      const positionInFrame = frameClips.indexOf(clip);
      const generationIndex = frameClips.length - 1 - positionInFrame;
      items.push({
        id: clip.id,
        type: "success",
        clipIndex: index,
        generationIndex
      });
    } else if (status === "created") {
      items.push({
        id: `${clip.id}-loading-0`,
        type: "loading",
        clipId: clip.id
      });
    } else {
      items.push({
        id: clip.id,
        type: "error",
        clip
      });
    }
  });
  return items;
};

export const useImg2ImgHistoryClips = () => {
  const { data: selectedShot, isLoading: isShotLoading } = useSelectedShot();

  const img2imgLayer = selectedShot?.layers.find(
    (layer: Layer) => layer.type === LayerType.IMG2IMG.toLocaleUpperCase()
  );
  const clips = img2imgLayer?.clips || [];
  const sortedClips = [...clips].sort(
    (a, b) =>
      new Date(b.asset.created_at).getTime() -
      new Date(a.asset.created_at).getTime()
  );
  const groupedClips = groupBy(clips, "data.frame");
  const gridItems = buildGridItems(sortedClips, groupedClips);
  return {
    data: {
      gridItems,
      groupedClips,
      sortedClips
    },
    isLoading: isShotLoading
  };
};
