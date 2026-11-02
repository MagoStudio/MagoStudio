import { useExpandedFolderIdsAtom } from "@store/atoms";
import { useAtom } from "jotai";
export const useExpandedFolders = () => {
  const [expandedFolderIds, setExpandedFolderIds] = useAtom(
    useExpandedFolderIdsAtom()
  );
  const isExpanded = (folderId: string) => expandedFolderIds.includes(folderId);
  const toggleFolder = (folderId: string) => {
    setExpandedFolderIds((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId]
    );
  };
  const expandFolder = (folderId: string) => {
    setExpandedFolderIds((prev) =>
      prev.includes(folderId) ? prev : [...prev, folderId]
    );
  };
  const collapseFolder = (folderId: string) => {
    setExpandedFolderIds((prev) => prev.filter((id) => id !== folderId));
  };
  const expandFolders = (folderIds: string[]) => {
    setExpandedFolderIds((prev) => {
      const set = new Set(prev);
      folderIds.forEach((id) => set.add(id));
      return Array.from(set);
    });
  };
  return {
    expandedFolderIds,
    isExpanded,
    toggleFolder,
    expandFolder,
    expandFolders,
    collapseFolder
  };
};
