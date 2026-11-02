import { useSearchParams } from "next/navigation";

export const useSelectedProjectId = () => {
  const searchParams = useSearchParams();
  const paramsProjectId = searchParams.get("projectId");

  return paramsProjectId || undefined;
};
