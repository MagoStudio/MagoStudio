import { useHandleTrackNavigation } from "@hooks/useHandleTrackNavigation";
import { activeHotkeyAtom } from "@store/atoms";
import { useAtomValue } from "jotai";
import { useHotkeys } from "react-hotkeys-hook";

export const useTrackKeyboardNavigation = () => {
  const handleTrackNavigation = useHandleTrackNavigation();
  const activeScope = useAtomValue(activeHotkeyAtom);

  useHotkeys(
    "up",
    () => handleTrackNavigation("up"),
    {
      preventDefault: true,
      enableOnFormTags: false,
      enabled: activeScope === "projectView"
    },
    [handleTrackNavigation, activeScope]
  );

  useHotkeys(
    "down",
    () => handleTrackNavigation("down"),
    {
      preventDefault: true,
      enableOnFormTags: false,
      enabled: activeScope === "projectView"
    },
    [handleTrackNavigation, activeScope]
  );
};
