import { useLocalStorage } from "usehooks-ts";

import { ScenesLayout } from "../utils/scenesLayout";
import { ScenesView } from "../utils/scenesView";

const SCENES_LAYOUT_PREFERENCE_BY_VIEW: Record<
  ScenesView,
  { storageKey: string; defaultScenesLayout: ScenesLayout }
> = {
  video: {
    storageKey: "script-project-scenes-layout",
    defaultScenesLayout: "cards"
  },
  storyboard: {
    storageKey: "script-project-storyboard-layout",
    defaultScenesLayout: "list"
  }
};

export const useScenesLayout = (scenesView: ScenesView) => {
  const { storageKey, defaultScenesLayout } =
    SCENES_LAYOUT_PREFERENCE_BY_VIEW[scenesView];
  const [scenesLayout, setScenesLayout] = useLocalStorage<ScenesLayout>(
    storageKey,
    defaultScenesLayout
  );

  return { scenesLayout, setScenesLayout };
};
