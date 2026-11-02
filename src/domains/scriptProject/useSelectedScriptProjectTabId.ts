import {
  useGetScriptProjectTabIdFromUrl,
  useSetScriptProjectTabIdFromUrl
} from "./data/useGetScriptProjectTabIdFromUrl";

export const useSelectedScriptProjectTabId = () => {
  const selectedScriptProjectTabId = useGetScriptProjectTabIdFromUrl();
  const setSelectedScriptProjectTabId = useSetScriptProjectTabIdFromUrl();

  return { selectedScriptProjectTabId, setSelectedScriptProjectTabId };
};
