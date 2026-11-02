import {
  useProjectSortByAtom,
  useProjectSortDirectionAtom
} from "@store/atoms/projectSortAtom";
import { useAtom } from "jotai";

import { FolderOrProject } from "./interface";

const getDirectChildren = (
  parentId: string | null,
  allItems: FolderOrProject[]
): FolderOrProject[] => {
  return allItems.filter((item) => {
    const itemParentId = item.parentFolderId || null;
    return itemParentId === parentId;
  });
};

const computeFolderEffectiveDate = (
  folderId: string,
  allItems: FolderOrProject[],
  cache: Map<string, number>,
  visiting: Set<string> = new Set()
): number => {
  if (cache.has(folderId)) {
    return cache.get(folderId)!;
  }

  if (visiting.has(folderId)) {
    return 0;
  }

  const folder = allItems.find((item) => item.id === folderId);
  if (!folder) return 0;

  visiting.add(folderId);
  let maxDate = folder.createdAt;

  const children = getDirectChildren(folderId, allItems);
  for (const child of children) {
    if (child.type === "folder") {
      const childDate = computeFolderEffectiveDate(
        child.id,
        allItems,
        cache,
        visiting
      );
      maxDate = Math.max(maxDate, childDate);
    } else {
      maxDate = Math.max(maxDate, child.createdAt);
    }
  }
  visiting.delete(folderId);
  cache.set(folderId, maxDate);
  return maxDate;
};

const getEffectiveDate = (
  item: FolderOrProject,
  allItems: FolderOrProject[],
  cache: Map<string, number>
): number => {
  if (item.type === "project") {
    return item.createdAt;
  }
  return computeFolderEffectiveDate(item.id, allItems, cache);
};

export const useProjectFoldersSorting = () => {
  const [sortBy, setSortBy] = useAtom(useProjectSortByAtom());
  const [sortDirection, setSortDirection] = useAtom(
    useProjectSortDirectionAtom()
  );
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };
  const sortItems = (
    items: FolderOrProject[],
    allItems: FolderOrProject[]
  ): FolderOrProject[] => {
    if (items.length === 0) return items;

    const cache = new Map<string, number>();

    return [...items].sort((a, b) => {
      let comparison: number;

      if (sortBy === "alphabetical") {
        comparison = a.name.localeCompare(b.name);
      } else {
        const aDate = getEffectiveDate(a, allItems, cache);
        const bDate = getEffectiveDate(b, allItems, cache);
        comparison = aDate - bDate;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  };
  return {
    sortBy,
    sortDirection,
    setSortBy,
    setSortDirection,
    toggleSortDirection,
    sortItems
  };
};
