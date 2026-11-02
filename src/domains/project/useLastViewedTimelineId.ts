import { useUserLocalStorage } from "@hooks/userLocalStorage/useUserLocalStorage";
import { useUser } from "@platform/identity";

const LAST_VIEWED_TIMELINE_KEY = "lastViewedTimelineId";

export const useLastViewedTimelineId = (projectId: string | undefined) => {
  const { isLoaded } = useUser();
  const [lastViewedTimelineId, setLastViewedTimelineId] = useUserLocalStorage<
    string | null
  >(LAST_VIEWED_TIMELINE_KEY, null, { level: "project", projectId });

  return {
    lastViewedTimelineId: isLoaded ? lastViewedTimelineId : null,
    setLastViewedTimelineId,
    isUserLoaded: isLoaded
  };
};
