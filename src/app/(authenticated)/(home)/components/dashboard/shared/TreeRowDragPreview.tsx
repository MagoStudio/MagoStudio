import { Badge } from "@components/Badge";
import { Icon } from "@components/Icon";
import { Text } from "@components/Text";

interface DragPreviewItem {
  id: string;
  name: string;
  type: string;
}

interface Props {
  draggedIds: string[];
  itemById: Map<string, DragPreviewItem>;
  thumbnailUrlById?: Record<string, string | undefined>;
}

export const TreeRowDragPreview: React.FC<Props> = ({
  draggedIds,
  itemById,
  thumbnailUrlById
}) => {
  const firstId = draggedIds[0];
  const firstItem = firstId ? itemById.get(firstId) : undefined;
  const extraCount = Math.max(0, draggedIds.length - 1);
  const isFolder = firstItem?.type === "folder";
  const thumbnailUrl =
    firstItem && !isFolder ? thumbnailUrlById?.[firstItem.id] : undefined;

  return (
    <div
      data-testid="tree-row-drag-preview"
      className="flex items-center gap-2 px-2 py-1.5 bg-surface-secondary border border-glyph-action-main rounded-md shadow-md max-w-[260px]"
    >
      {isFolder ? (
        <Icon iconSet="16" iconName="folder" />
      ) : thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="h-6 w-[42px] rounded object-cover shrink-0"
        />
      ) : (
        <Icon iconSet="16" iconName="edit-video" />
      )}
      <Text
        component="span"
        variant="sm"
        color="glyph-primary"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        className="min-w-0 flex-1 truncate"
      >
        {firstItem?.name ?? ""}
      </Text>
      {extraCount > 0 && (
        <Badge glyphColor="glyph-primary" className="ml-1">
          +{extraCount}
        </Badge>
      )}
    </div>
  );
};
