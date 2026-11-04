import { useLocalStorage } from "usehooks-ts";

export const SCENE_TIMELINE_SHOWN_KEY = "mago_scene_timeline_shown";

export const useSceneTimelineVisibilitySetting = () =>
  useLocalStorage<boolean>(SCENE_TIMELINE_SHOWN_KEY, true);
