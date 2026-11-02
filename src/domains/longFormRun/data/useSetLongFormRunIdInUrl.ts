import { useShallowRouter } from "@hooks/useShallowRouter";
import { setSearchParam } from "@utils/url/setSearchParam";
import { usePathname } from "next/navigation";

import { LONG_FORM_RUN_ID_PARAM_KEY } from "../constants";

export const useSetLongFormRunIdInUrl = () => {
  const shallowRouter = useShallowRouter();
  const pathname = usePathname();

  return (runId: string) => {
    const newSearch = setSearchParam(
      window.location.search,
      LONG_FORM_RUN_ID_PARAM_KEY,
      runId
    );
    shallowRouter.replace(`${pathname}?${newSearch}`);
  };
};
