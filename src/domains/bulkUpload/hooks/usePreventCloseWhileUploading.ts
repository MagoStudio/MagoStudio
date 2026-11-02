import { bulkUploadAtom } from "@store/atoms";
import { useAtomValue } from "jotai";
import { useEventListener } from "usehooks-ts";

export const usePreventCloseWhileUploading = () => {
  const { isUploadInProgress } = useAtomValue(bulkUploadAtom);

  useEventListener("beforeunload", (e) => {
    if (isUploadInProgress) e.preventDefault();
  });
};
