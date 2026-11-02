import { Checkbox } from "@components/Checkbox";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Text } from "@components/Text";
import { cn } from "@utils";
import {
  Button,
  Disclosure,
  DisclosurePanel,
  Heading
} from "react-aria-components";
import { useTranslation } from "react-i18next";

type FolderRowProps = {
  name: string;
  depth: number;
  isExpanded: boolean;
  onExpandedChange: (isExpanded: boolean) => void;
  children: React.ReactNode;
  type?: "folder" | "project";
  isSelected?: boolean;
  isBulkActionMode?: boolean;
  isShared?: boolean;
  showFolderAndDeleteActions?: boolean;
  onCreateFolder?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  testId?: string;
};

export const FOLDER_ROW_BASE_INDENT_PX = 8;
export const FOLDER_ROW_INDENT_STEP_PX = 8;

export function FolderRow({
  name,
  depth,
  isExpanded,
  onExpandedChange,
  children,
  type = "folder",
  isSelected = false,
  isBulkActionMode = false,
  isShared = false,
  showFolderAndDeleteActions = false,
  onCreateFolder,
  onDelete,
  onShare,
  testId
}: FolderRowProps) {
  const { t } = useTranslation();
  const isFolder = type === "folder";
  const isBulkActionModeCollapsed = isFolder && isBulkActionMode && !isExpanded;
  const isBulkActionModeExpanded = isFolder && isBulkActionMode && isExpanded;
  const hasHighlightedBackground = isSelected;
  const showsTrailingActionsOnHover = !isSelected && !isBulkActionMode;

  return (
    <Disclosure
      isExpanded={isExpanded}
      onExpandedChange={onExpandedChange}
      data-testid={testId}
    >
      <Heading level={3} className="contents">
        <Button
          slot="trigger"
          className={cn(
            "group flex h-8 w-full shrink-0 items-center gap-2 rounded pr-2 outline-hidden",
            isBulkActionModeExpanded && "border border-glyph-action-main",
            hasHighlightedBackground
              ? "bg-element-primary-active"
              : "data-[hovered]:bg-element-primary-active"
          )}
          style={{
            paddingLeft:
              FOLDER_ROW_BASE_INDENT_PX + depth * FOLDER_ROW_INDENT_STEP_PX
          }}
        >
          {isFolder && (
            <Icon
              iconSet="16"
              iconName={isExpanded ? "chevron-down" : "chevron-right"}
              className={cn(
                "shrink-0",
                isSelected
                  ? "text-glyph-primary"
                  : "text-glyph-secondary group-data-[hovered]:text-glyph-primary"
              )}
            />
          )}
          <Text
            component="span"
            variant="sm"
            color="glyph-secondary"
            select="none"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            className={cn(
              "min-w-0 flex-1 text-left",
              !isSelected && "group-data-[hovered]:text-glyph-primary"
            )}
          >
            {name}
          </Text>

          {isSelected && (
            <Icon
              iconSet="16"
              iconName="checkmark"
              className="shrink-0 text-glyph-primary"
            />
          )}

          {isBulkActionModeCollapsed && (
            <span aria-hidden className="shrink-0">
              <Checkbox isChecked={false} isPresentational />
            </span>
          )}

          {!isFolder && isBulkActionMode && (
            <span aria-hidden className="shrink-0">
              <Checkbox isChecked={false} isPresentational />
            </span>
          )}

          {isFolder &&
            !isSelected &&
            !isBulkActionMode &&
            showFolderAndDeleteActions && (
              <div
                className="hidden items-center gap-2 group-data-[hovered]:flex"
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

          {!isFolder && showsTrailingActionsOnHover && (
            <div
              className="flex items-center gap-2"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {isShared && (
                <IconActionButton
                  size="xs"
                  variant="transparent"
                  icon={<Icon iconSet="16" iconName="share" />}
                  aria-label={t("actions.share.label")}
                  onPress={onShare}
                />
              )}
              <div className="hidden group-data-[hovered]:flex">
                <IconActionButton
                  size="xs"
                  variant="transparent"
                  icon={<Icon iconSet="16" iconName="delete" />}
                  aria-label={t("actions.delete.label")}
                  onPress={onDelete}
                />
              </div>
            </div>
          )}
        </Button>
      </Heading>
      <DisclosurePanel className="flex flex-col [&[hidden]]:hidden">
        {children}
      </DisclosurePanel>
    </Disclosure>
  );
}
