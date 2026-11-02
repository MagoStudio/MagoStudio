import { useShallowRouter } from "@hooks/useShallowRouter";
import { setSearchParam } from "@utils/url/setSearchParam";
import { useSearchParams, usePathname } from "next/navigation";

export const SELECTED_TRACK_IDS_URL_PARAM = "selectedTrackIds";

export const useGetSelectedTrackIdsFromUrl = () => {
  const params = useSearchParams();

  const selectedTrackIdString = params.get(SELECTED_TRACK_IDS_URL_PARAM);
  return selectedTrackIdString ? selectedTrackIdString.split(",") : [];
};

export const useSetSelectedTrackIdsFromUrl = () => {
  const shallowRouter = useShallowRouter();
  const pathname = usePathname();

  const setSelectedTrackIds = (trackIds: string[]) => {
    if (trackIds.length === 0) {
      return;
    }
    const newSearch = setSearchParam(
      window.location.search,
      SELECTED_TRACK_IDS_URL_PARAM,
      trackIds.join(",")
    );

    shallowRouter.replace(`${pathname}?${newSearch}`);
  };

  return setSelectedTrackIds;
};
