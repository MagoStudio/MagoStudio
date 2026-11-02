import { activeHotkeyAtom, isPlayingAtom } from "@store/atoms";
import { useAtomValue } from "jotai";
import { useHotkeys } from "react-hotkeys-hook";

import { useHandleFrameNavigation } from "./useHandleFrameNavigation";

export const useFrameKeyboardNavigation = () => {
  const handleFrameNavigation = useHandleFrameNavigation();
  const isPlaying = useAtomValue(isPlayingAtom);
  const activeScope = useAtomValue(activeHotkeyAtom);

  const areHotkeysEnabled =
    !isPlaying && ["projectView", "Img2ImgView"].includes(activeScope);

  useHotkeys(
    "left",
    () => handleFrameNavigation("left"),
    {
      preventDefault: true,
      enableOnFormTags: false,
      enabled: areHotkeysEnabled
    },
    [handleFrameNavigation, isPlaying, activeScope]
  );

  useHotkeys(
    "right",
    () => handleFrameNavigation("right"),
    {
      preventDefault: true,
      enableOnFormTags: false,
      enabled: areHotkeysEnabled
    },
    [handleFrameNavigation, isPlaying, activeScope]
  );

  return handleFrameNavigation;
};
