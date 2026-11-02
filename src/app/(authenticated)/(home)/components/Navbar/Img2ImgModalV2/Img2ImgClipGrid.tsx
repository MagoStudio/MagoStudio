import { useImg2ImgHistoryClips } from "@domains/track/useImg2ImgHistoryClips";
import { Clip } from "@schemas/clip";
import React from "react";
import { GridList, GridListItem } from "react-aria-components/GridList";
import {
  GridLayout,
  Size,
  Virtualizer
} from "react-aria-components/Virtualizer";

import { Img2ImgEmptyState } from "./Img2ImgEmptyState";
import { ErrorClip } from "./Img2imgModalHistory/ErrorClip";
import { LoadingClipItem } from "./Img2imgModalHistory/LoadingClipItem";

const GRID_MIN_ITEM_WIDTH = 300;
const GRID_MIN_ITEM_HEIGHT = 280;
const GRID_GAP = 20;
const GRID_MAX_COLUMNS = 2;

type SuccessClipComponentProps = {
  index: number;
  generationIndex: number;
  allClips: Clip[];
  disableIterate?: boolean;
};

type Img2ImgClipGridProps = {
  successClipComponent: React.ComponentType<SuccessClipComponentProps>;
  maxColumns?: number;
};

export const Img2ImgClipGrid: React.FC<Img2ImgClipGridProps> = ({
  successClipComponent: SuccessClipComponent,
  maxColumns = GRID_MAX_COLUMNS
}) => {
  const {
    data: { sortedClips, gridItems }
  } = useImg2ImgHistoryClips();

  const hasClips = sortedClips.length > 0;

  if (!hasClips) {
    return <Img2ImgEmptyState />;
  }

  return (
    <div className="h-full w-full px-4">
      <Virtualizer
        layout={GridLayout}
        layoutOptions={{
          minItemSize: new Size(GRID_MIN_ITEM_WIDTH, GRID_MIN_ITEM_HEIGHT),
          maxItemSize: new Size(Infinity, Infinity),
          minSpace: new Size(GRID_GAP, GRID_GAP),
          maxColumns
        }}
      >
        <GridList
          items={gridItems}
          aria-label="Generated images"
          className="h-full w-full overflow-y-auto scrollbar-custom outline-none"
          selectionMode="none"
          renderEmptyState={() => null}
        >
          {(item) => (
            <GridListItem
              id={item.id}
              textValue={item.id}
              className="outline-none"
            >
              {item.type === "success" && (
                <SuccessClipComponent
                  index={item.clipIndex}
                  generationIndex={item.generationIndex}
                  allClips={sortedClips}
                />
              )}
              {item.type === "loading" && (
                <LoadingClipItem clipId={item.clipId} />
              )}
              {item.type === "error" && <ErrorClip clip={item.clip} />}
            </GridListItem>
          )}
        </GridList>
      </Virtualizer>
    </div>
  );
};
