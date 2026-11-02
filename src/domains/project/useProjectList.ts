import { ProjectType } from "@schemas/scriptProject";
import { useInfiniteQuery } from "@tanstack/react-query";

import { isLocalApp } from "@/platform/localDesktop";
import { queryKeys } from "@/queryKeys";

export type { ProjectListItem } from "./api/fetchProjectList";

import {
  DEFAULT_PER_PAGE,
  type ProjectListItem,
  fetchProjectList
} from "./api/fetchProjectList";
import { keepProjectsOfType } from "./utils/keepProjectsOfType";

const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const STALE_TIME_MINUTES = 5;
const STALE_TIME_MS =
  STALE_TIME_MINUTES * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

type UseProjectListParams = {
  perPage?: number;
  sortBy?: "updated_at" | "name";
  sortOrder?: "asc" | "desc";
  projectType?: ProjectType;
  enabled?: boolean;
};

export const useProjectList = ({
  perPage = DEFAULT_PER_PAGE,
  sortBy = "updated_at",
  sortOrder = "desc",
  projectType,
  enabled = true
}: UseProjectListParams = {}) => {
  const query = useInfiniteQuery({
    queryKey: queryKeys.projectList.paginated({
      perPage,
      sortBy,
      sortOrder,
      projectType
    }),
    queryFn: ({ pageParam }) =>
      fetchProjectList({
        page: pageParam,
        perPage,
        sortBy,
        sortOrder,
        projectType
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next ? lastPage.pagination.next_num : undefined,
    staleTime: STALE_TIME_MS,
    enabled,
    refetchOnMount: isLocalApp ? "always" : true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
  const allItems: ProjectListItem[] = keepProjectsOfType(
    query.data?.pages.flatMap((page) => page.items) ?? [],
    projectType
  );
  const totalCount = query.data?.pages[0]?.pagination.total ?? 0;

  return {
    ...query,
    allItems,
    totalCount
  };
};
