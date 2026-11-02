import { buildStoryboardGridSvg } from "./buildStoryboardGridSvg";
import { StoryboardPanelBox } from "./layoutStoryboardGrid";

export const buildStoryboardGridImageSource = ({
  panelBoxes,
  hasWhitePaper
}: {
  panelBoxes: StoryboardPanelBox[];
  hasWhitePaper: boolean;
}): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    buildStoryboardGridSvg({ panelBoxes, hasWhitePaper })
  )}`;
