import { useShallowRouter } from "@hooks/useShallowRouter";
import { setSearchParam } from "@utils/url/setSearchParam";
import { usePathname, useSearchParams } from "next/navigation";

import { SCRIPT_PROJECT_TAB_PARAM_KEY } from "../constants";
import { resolveScriptProjectTabId } from "../utils/resolveScriptProjectTabId";

export const useGetScriptProjectTabIdFromUrl = () => {
  const searchParams = useSearchParams();

  return resolveScriptProjectTabId(
    searchParams.get(SCRIPT_PROJECT_TAB_PARAM_KEY)
  );
};

export const useSetScriptProjectTabIdFromUrl = () => {
  const shallowRouter = useShallowRouter();
  const pathname = usePathname();

  return (tabIdCandidate: string) => {
    const newSearch = setSearchParam(
      window.location.search,
      SCRIPT_PROJECT_TAB_PARAM_KEY,
      resolveScriptProjectTabId(tabIdCandidate)
    );

    shallowRouter.replace(`${pathname}?${newSearch}`);
  };
};
