import { SHOT_DRAG_ITEM_TYPE } from "@domains/scriptProject/constants";
import { cn } from "@utils";
import { useRef } from "react";
import { useDrop } from "react-aria";

type Props = {
  children: React.ReactNode;
  isDropAccepted: boolean;
  isDroppedShotPlacedAfter: boolean;
  onDropShot: (droppedShotTimelineId: string) => void;
};

export const ShotDropTarget: React.FC<Props> = ({
  children,
  isDropAccepted,
  isDroppedShotPlacedAfter,
  onDropShot
}) => {
  const dropTargetRef = useRef<HTMLDivElement>(null);
  const { dropProps, isDropTarget } = useDrop({
    ref: dropTargetRef,
    getDropOperation: (types) =>
      isDropAccepted && types.has(SHOT_DRAG_ITEM_TYPE) ? "move" : "cancel",
    onDrop: async (event) => {
      const droppedShotItem = event.items.find(
        (item) => item.kind === "text" && item.types.has(SHOT_DRAG_ITEM_TYPE)
      );
      if (droppedShotItem?.kind !== "text") return;
      onDropShot(await droppedShotItem.getText(SHOT_DRAG_ITEM_TYPE));
    }
  });
  const isDropIndicatorShown = isDropTarget && isDropAccepted;

  return (
    <div {...dropProps} ref={dropTargetRef} className="relative shrink-0">
      {isDropIndicatorShown && (
        <div
          className={cn(
            "pointer-events-none absolute -inset-y-1 z-20 w-0.5 rounded-full bg-glyph-action-main",
            isDroppedShotPlacedAfter ? "-right-2" : "-left-2"
          )}
        />
      )}
      {children}
    </div>
  );
};
