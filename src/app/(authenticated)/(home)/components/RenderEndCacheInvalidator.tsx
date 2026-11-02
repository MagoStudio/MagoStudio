import { useInvalidateCachesWhenRendersEnd } from "@hooks/queue/useInvalidateCachesWhenRendersEnd";

export const RenderEndCacheInvalidator = () => {
  useInvalidateCachesWhenRendersEnd();
  return null;
};
