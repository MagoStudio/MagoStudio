import { Checkbox } from "@components/Checkbox";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Skeleton } from "@components/Skeleton";
import { Text } from "@components/Text";
import { cn } from "@utils";
import { useHover } from "react-aria";
import { useTranslation } from "react-i18next";

import { useTwoLineTruncatedFromStart } from "./hooks/useTwoLineTruncatedFromStart";

const CHECKBOX_INSET_PX = 16;

type ShotCardProps = {
  shotName: string;
  thumbnailUrl: string | undefined;
  isSelected: boolean;
  isOpen: boolean;
  isLoading: boolean;
  hasThumbnailError: boolean;
  onToggle: () => void;
  showFolderAndDeleteActions?: boolean;
  onCreateFolder?: () => void;
  onDelete?: () => void;
  hasInteractionHighlight?: boolean;
  isEditing?: boolean;
};

export function ShotCard({
  shotName,
  thumbnailUrl,
  isSelected,
  isOpen,
  isLoading,
  hasThumbnailError,
  onToggle,
  showFolderAndDeleteActions = false,
  onCreateFolder,
  onDelete,
  hasInteractionHighlight = false,
  isEditing = false
}: ShotCardProps) {
  const { t } = useTranslation();
  const { hoverProps, isHovered } = useHover({});
  const hasThickBorder = !isEditing && (isSelected || hasInteractionHighlight);
  const showsThumbnailImage =
    !isLoading && !hasThumbnailError && !!thumbnailUrl;
  const { truncatedName, nameElementRef } =
    useTwoLineTruncatedFromStart(shotName);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-rac
      data-hovered={isHovered || undefined}
      aria-pressed={isSelected}
      aria-current={isOpen || undefined}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      {...hoverProps}
      className={cn(
        "group relative flex h-[216px] w-[134px] flex-col items-start justify-center gap-1.5 rounded p-2 outline-hidden",
        !isEditing &&
          isSelected &&
          "bg-element-primary shadow-[inset_0_0_0_2px_var(--color-glyph-action-main)]",
        !isEditing &&
          hasInteractionHighlight &&
          !isSelected &&
          "bg-element-primary shadow-[inset_0_0_0_2px_var(--color-glyph-success)]",
        !hasThickBorder &&
          "bg-element-primary data-[hovered]:bg-element-primary-active"
      )}
    >
      <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-[2px]">
        {isLoading && <Skeleton className="size-full rounded-[2px]" />}
        {!isLoading && !showsThumbnailImage && (
          <div className="flex size-full items-center justify-center rounded-[2px] bg-element-on-image">
            <Icon
              iconSet="24"
              iconName="broken-image"
              className="text-glyph-secondary"
            />
          </div>
        )}
        {showsThumbnailImage && (
          <>
            <img
              src={thumbnailUrl}
              alt=""
              className="pointer-events-none absolute inset-0 size-full rounded-[2px] object-cover"
            />
            {!hasThickBorder && (
              <div className="pointer-events-none absolute inset-0 rounded-[2px] bg-surface-bg-100-opacity-80 opacity-0 group-data-[hovered]:opacity-100" />
            )}
          </>
        )}
      </div>

      {!isOpen && !isEditing && (
        <Text
          component="p"
          variant="2xs"
          color="glyph-primary"
          overflow="hidden"
          textOverflow="ellipsis"
          className="h-8 w-[118px] shrink-0 leading-4 [word-break:break-word]"
        >
          {shotName}
        </Text>
      )}

      {isOpen && !isEditing && (
        <div className="flex w-full shrink-0 items-end gap-1.5">
          <Text
            ref={nameElementRef}
            component="p"
            variant="2xs"
            color="glyph-primary"
            className="h-8 min-w-0 flex-1 overflow-hidden leading-4 [word-break:break-all]"
          >
            {truncatedName}
          </Text>
          <Icon
            iconSet="16"
            iconName="checkmark"
            className="shrink-0 text-glyph-primary"
          />
        </div>
      )}

      {isEditing && (
        <div className="flex w-full shrink-0 items-end gap-1.5">
          <div className="flex h-8 min-w-0 flex-1 items-center rounded border border-glyph-action-main bg-element-primary px-2">
            <input
              defaultValue={shotName}
              className="w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap bg-transparent text-left text-[length:11px] leading-4 text-glyph-primary outline-hidden [direction:rtl]"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            />
          </div>
        </div>
      )}

      <div
        className="absolute"
        style={{ left: CHECKBOX_INSET_PX, top: CHECKBOX_INSET_PX }}
      >
        <Checkbox
          isChecked={isSelected}
          isPresentational
          hoverFillsBackground={false}
        />
      </div>

      {showFolderAndDeleteActions && !isEditing && (
        <div
          className="absolute right-4 top-4 hidden items-center gap-2 group-data-[hovered]:flex"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <IconActionButton
            size="xs"
            variant="transparent"
            icon={<Icon iconSet="16" iconName="create-new-folder" />}
            aria-label={t("actions.create_folder.label")}
            onPress={onCreateFolder}
          />
          <IconActionButton
            size="xs"
            variant="transparent"
            icon={<Icon iconSet="16" iconName="delete" />}
            aria-label={t("actions.delete.label")}
            onPress={onDelete}
          />
        </div>
      )}
    </div>
  );
}
