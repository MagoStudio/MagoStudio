import { useProjectShotFolders } from "@domains/project/shotFolders/useProjectShotFolders";
import { useDeleteProject } from "@domains/project/useDeleteProject";
import { useDeleteShotItem } from "@domains/project/useDeleteShotItem";
import { shouldDeleteProjectAfter } from "@domains/project/utils/shouldDeleteProjectAfter";

import { computeLeafShotCount } from "../utils/computeLeafShotCount";
import { pruneDescendantsFromSelection } from "../utils/pruneDescendantsFromSelection";

export const useBulkDeleteShotItems = (projectId: string | undefined) => {
  const { data } = useProjectShotFolders(projectId);
  const { mutateAsync: deleteItem, isPending } = useDeleteShotItem(projectId);
  const { mutateAsync: deleteProject } = useDeleteProject();

  const bulkDelete = async (ids: Iterable<string>) => {
    const allItems = data?.shotFoldersAndShots ?? [];
    const prunedIds = pruneDescendantsFromSelection(ids, allItems);
    const willEmptyProject = shouldDeleteProjectAfter(prunedIds, allItems);

    const results = await Promise.allSettled(
      prunedIds.map((id) => deleteItem(id, { skipProjectDelete: true }))
    );

    const allShotDeletesSucceeded = results.every(
      (r) => r.status === "fulfilled" && r.value.allShotDeletesSucceeded
    );

    if (willEmptyProject && allShotDeletesSucceeded && projectId) {
      try {
        await deleteProject({ projectId });
      } catch {}
    }
  };

  const willEmptyProject = (ids: Iterable<string>) => {
    const allItems = data?.shotFoldersAndShots ?? [];
    const prunedIds = pruneDescendantsFromSelection(ids, allItems);
    return shouldDeleteProjectAfter(prunedIds, allItems);
  };

  const getLeafShotCount = (ids: Iterable<string>) => {
    const allItems = data?.shotFoldersAndShots ?? [];
    const prunedIds = pruneDescendantsFromSelection(ids, allItems);
    return computeLeafShotCount(prunedIds, allItems);
  };

  return { bulkDelete, getLeafShotCount, willEmptyProject, isPending };
};
