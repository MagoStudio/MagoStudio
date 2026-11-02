import { FOLDER_ROW_INDENT_STEP_PX } from "@components/FolderRow";
import { ShotCard } from "@components/ShotCard";
import { ShotFolderTreeNode } from "@domains/project/shotFolders/utils/buildShotFolderTree";

import { BulkRenderingFolderNode } from "./BulkRenderingFolderNode";
import { BulkRenderingShotListSharedProps } from "./BulkRenderingShotListSharedProps";

type BulkRenderingShotListProps = BulkRenderingShotListSharedProps & {
  tree: ShotFolderTreeNode[];
  depth?: number;
};

function getOwnThumbnailUrl(
  thumbnailUrlById: Record<string, string | undefined>,
  shotId: string
): string | undefined {
  return Object.hasOwn(thumbnailUrlById, shotId)
    ? thumbnailUrlById[shotId]
    : undefined;
}

export function BulkRenderingShotList({
  tree,
  depth = 0,
  thumbnailUrlById,
  isThumbnailListLoading,
  openShotId,
  isShotSelected,
  onToggleShot
}: BulkRenderingShotListProps) {
  const shotNodes = tree.filter((node) => node.type === "shot");
  const folderNodes = tree.filter((node) => node.type === "folder");

  return (
    <div className="flex flex-col gap-0.5">
      {shotNodes.length > 0 && (
        <div
          className="flex flex-wrap gap-1"
          style={{ paddingLeft: depth * FOLDER_ROW_INDENT_STEP_PX }}
        >
          {shotNodes.map((node) => {
            const thumbnailUrl = getOwnThumbnailUrl(thumbnailUrlById, node.id);
            return (
              <ShotCard
                key={node.id}
                shotName={node.name}
                thumbnailUrl={thumbnailUrl}
                isSelected={isShotSelected(node.id)}
                isOpen={node.id === openShotId}
                isLoading={isThumbnailListLoading}
                hasThumbnailError={!isThumbnailListLoading && !thumbnailUrl}
                onToggle={() => onToggleShot(node.id)}
              />
            );
          })}
        </div>
      )}
      {folderNodes.map((node) => (
        <BulkRenderingFolderNode
          key={node.id}
          node={node}
          depth={depth}
          thumbnailUrlById={thumbnailUrlById}
          isThumbnailListLoading={isThumbnailListLoading}
          openShotId={openShotId}
          isShotSelected={isShotSelected}
          onToggleShot={onToggleShot}
        />
      ))}
    </div>
  );
}
