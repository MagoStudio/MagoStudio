import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { SHOT_DRAG_ITEM_TYPE } from "@domains/scriptProject/constants";
import { cn } from "@utils";
import { useRef } from "react";
import { DragPreview, useDrag } from "react-aria";
import { useTranslation } from "react-i18next";

type Props = {
  shotTimelineId: string;
  shotLabel: string;
  isDisabled: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  testId: string;
};

export const ShotDragHandle: React.FC<Props> = ({
  shotTimelineId,
  shotLabel,
  isDisabled,
  onDragStart,
  onDragEnd,
  testId
}) => {
  const { t } = useTranslation();
  const dragPreviewRef = useRef(null);
  const { dragProps, isDragging } = useDrag({
    isDisabled,
    preview: dragPreviewRef,
    getItems: () => [{ [SHOT_DRAG_ITEM_TYPE]: shotTimelineId }],
    onDragStart,
    onDragEnd
  });

  return (
    <>
      <div
        {...dragProps}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-label={t("script_project.shot_drag_handle.ariaLabel")}
        aria-disabled={isDisabled}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded text-glyph-tertiary outline-hidden",
          isDisabled
            ? "text-glyph-disabled"
            : "cursor-grab hover:bg-element-primary hover:text-glyph-primary focus-visible:ring-1 focus-visible:ring-glyph-action-main",
          isDragging && "cursor-grabbing"
        )}
        data-testid={testId}
      >
        <Icon iconSet="16-technical" iconName="drag-handle-dots" />
      </div>
      <DragPreview ref={dragPreviewRef}>
        {() => (
          <div className="rounded-lg border border-glyph-action-main bg-surface-secondary px-3 py-2">
            <Text variant="sm" weight="semibold">
              {shotLabel}
            </Text>
          </div>
        )}
      </DragPreview>
    </>
  );
};
