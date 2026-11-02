import { useShallowRouter } from "@hooks/useShallowRouter";
import { setSearchParam } from "@utils/url/setSearchParam";
import { useSearchParams, usePathname } from "next/navigation";

const selectedShotIdKey = "timelineId";

export const useGetSelectedShotIdFromUrl = () => {
  const params = useSearchParams();
  const selectedShotId = params.get(selectedShotIdKey) || undefined;

  return selectedShotId;
};

export const useSetSelectedShotIdFromUrl = () => {
  const shallowRouter = useShallowRouter();
  const pathname = usePathname();

  const setSelectedShotId = (shotId: string | undefined) => {
    const newSearch = setSearchParam(
      window.location.search,
      selectedShotIdKey,
      shotId
    );

    shallowRouter.replace(`${pathname}?${newSearch}`);
  };

  return setSelectedShotId;
};
