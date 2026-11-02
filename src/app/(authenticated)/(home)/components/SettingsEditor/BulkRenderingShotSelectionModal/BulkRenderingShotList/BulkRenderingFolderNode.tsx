import { FolderRow } from "@components/FolderRow";
import { ShotFolderTreeNode } from "@domains/project/shotFolders/utils/buildShotFolderTree";
import { useState } from "react";

import { BulkRenderingShotListSharedProps } from "./BulkRenderingShotListSharedProps";

import { BulkRenderingShotList } from ".";

type BulkRenderingFolderNodeProps = BulkRenderingShotListSharedProps & {
  node: ShotFolderTreeNode;
  depth: number;
};

export function BulkRenderingFolderNode({
  node,
  depth,
  ...sharedProps
}: BulkRenderingFolderNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <FolderRow
      name={node.name}
      depth={depth}
      isExpanded={isExpanded}
      onExpandedChange={setIsExpanded}
      testId={`folder-row-${node.id}`}
    >
      <BulkRenderingShotList
        tree={node.children}
        depth={depth + 1}
        {...sharedProps}
      />
    </FolderRow>
  );
}
