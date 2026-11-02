import { isMacOS } from "@utils";

export const useIsMacOS = (): boolean => {
  return isMacOS();
};
