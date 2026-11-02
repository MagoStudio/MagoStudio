import { useSearchParams } from "next/navigation";

import { LONG_FORM_RUN_ID_PARAM_KEY } from "../constants";

export const useLongFormRunIdFromUrl = (): string | undefined => {
  const searchParams = useSearchParams();
  return searchParams.get(LONG_FORM_RUN_ID_PARAM_KEY) || undefined;
};
