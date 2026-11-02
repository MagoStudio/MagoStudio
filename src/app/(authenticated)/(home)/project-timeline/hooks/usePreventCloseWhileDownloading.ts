import { activeTimelineDownloadsAtom } from "@store/atoms";
import { useAtomValue } from "jotai";
import { useEventListener } from "usehooks-ts";

export const usePreventCloseWhileDownloading = () => {
  const activeDownloads = useAtomValue(activeTimelineDownloadsAtom);

  useEventListener("beforeunload", (e) => {
    if (activeDownloads > 0) {
      e.preventDefault();
    }
  });
};
