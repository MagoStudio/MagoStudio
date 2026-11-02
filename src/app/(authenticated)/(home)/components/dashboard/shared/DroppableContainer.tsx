import { cn } from "@utils";
import { useRef, useState } from "react";
import { useDrop } from "react-aria";

import { getActiveDraggedIds } from "./dragRegistry";
import { parseDragPayloadIds } from "./parseDragPayloadIds";

interface Props {
  children: React.ReactNode;
  onDrop?: ({
    draggedIds,
    droppedOnId
  }: {
    draggedIds: string[];
    droppedOnId: string;
  }) => void;
  onDropFiles?: ({
    files,
    droppedOnId
  }: {
    files: File[];
    droppedOnId: string;
  }) => void;
  onDropEnter?: () => void;
  onDropExit?: () => void;
  isValidDropTarget?: (draggedIds: string[]) => boolean;
  id: string;
  dropIndicatorStyle?: "outline" | "line";
}

export const DroppableContainer: React.FC<Props> = ({
  children,
  onDrop,
  onDropFiles,
  onDropEnter,
  onDropExit,
  isValidDropTarget,
  id,
  dropIndicatorStyle = "line"
}) => {
  const ref = useRef(null);
  const [isAcceptingItems, setIsAcceptingItems] = useState(true);

  const { dropProps, isDropTarget } = useDrop({
    ref,
    getDropOperation(types) {
      if (types.has("text/json")) return "move";
      if (onDropFiles) return "move";
      return "cancel";
    },
    onDropEnter() {
      if (isValidDropTarget) {
        const ids = getActiveDraggedIds();
        const allowed = ids.length === 0 ? true : isValidDropTarget(ids);
        setIsAcceptingItems(allowed);
        if (!allowed) return;
      } else {
        setIsAcceptingItems(true);
      }
      onDropEnter?.();
    },
    onDropExit() {
      setIsAcceptingItems(true);
      onDropExit?.();
    },
    async onDrop(e) {
      const ids = await parseDragPayloadIds(
        e.items as unknown as Parameters<typeof parseDragPayloadIds>[0]
      );

      if (ids.length > 0) {
        onDrop?.({
          draggedIds: ids,
          droppedOnId: id
        });
      }

      const files = await Promise.all(
        e.items
          .filter((item) => item.kind === "file")
          .map((item: any) => item.getFile())
      );

      if (files.length > 0) {
        onDropFiles?.({
          files,
          droppedOnId: id
        });
      }
    }
  });

  const handleNativeDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const nativeFiles = Array.from(e.dataTransfer?.files ?? []);
    if (nativeFiles.length > 0) {
      onDropFiles?.({
        files: nativeFiles,
        droppedOnId: id
      });
    }

    (dropProps as Record<string, any>).onDrop?.(e);
  };

  const showAcceptState = isDropTarget && isAcceptingItems;

  return (
    <div
      {...dropProps}
      onDrop={handleNativeDrop}
      role="button"
      tabIndex={0}
      ref={ref}
      className={cn(
        "relative w-full h-full rounded border border-transparent",
        showAcceptState &&
          dropIndicatorStyle === "outline" &&
          "border border-glyph-success"
      )}
    >
      {showAcceptState && dropIndicatorStyle === "line" && (
        <div className="absolute top-0 left-0 right-0 h-px bg-glyph-success pointer-events-none" />
      )}
      {children}
    </div>
  );
};
