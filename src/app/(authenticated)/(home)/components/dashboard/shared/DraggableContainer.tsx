import { cn } from "@utils";
import { useRef } from "react";
import { DragPreview, useDrag } from "react-aria";

import { clearActiveDraggedIds, setActiveDraggedIds } from "./dragRegistry";

interface DragEvent {
  x: number;
  y: number;
}

interface Props {
  children: React.ReactNode;
  id: string;
  getDraggedIds?: (originId: string) => string[];
  renderDragPreview?: (draggedIds: string[]) => React.ReactNode;
}

const SCROLL_SPEED = 15;
const SCROLL_THRESHOLD = 200;

export const DraggableContainer: React.FC<Props> = ({
  children,
  id,
  getDraggedIds,
  renderDragPreview
}) => {
  const preview = useRef(null);
  const draggedIdsRef = useRef<string[]>([id]);

  const { dragProps } = useDrag({
    preview,
    getItems() {
      const ids = getDraggedIds ? getDraggedIds(id) : [id];
      draggedIdsRef.current = ids;
      setActiveDraggedIds(ids);
      return [
        {
          "text/json": JSON.stringify({ ids })
        }
      ];
    },
    onDragEnd() {
      clearActiveDraggedIds();
    },
    onDragMove(e: DragEvent) {
      const scrollContainer = document.querySelector(
        '[data-testid="projects-list-container"]'
      );
      if (!scrollContainer) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const distanceFromTop = e.y - containerRect.top;
      const distanceFromBottom = containerRect.bottom - e.y;

      if (distanceFromTop < SCROLL_THRESHOLD) {
        scrollContainer.scrollBy({ top: -SCROLL_SPEED, behavior: "smooth" });
      } else if (distanceFromBottom < SCROLL_THRESHOLD) {
        scrollContainer.scrollBy({ top: SCROLL_SPEED, behavior: "smooth" });
      }
    }
  });

  return (
    <>
      <div {...dragProps} tabIndex={0} className={cn("w-full h-full")}>
        {children}
      </div>
      <DragPreview ref={preview}>
        {(_) =>
          renderDragPreview ? (
            <>{renderDragPreview(draggedIdsRef.current)}</>
          ) : (
            <div
              className="border border-glyph-action-main rounded bg-element-primary-active h-full"
              style={{ width: "calc(var(--width-drawer) - 2rem)" }}
            >
              {children}
            </div>
          )
        }
      </DragPreview>
    </>
  );
};
