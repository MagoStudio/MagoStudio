"use client";

import { DropdownItem } from "@components/Dropdown";
import { InlineEditableText } from "@components/InlineEditableText";
import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import type { SortDirection } from "@domains/project/shotFolders/useShotFoldersSorting";
import { ShotsToolbar } from "@home/components/dashboard/shared/ShotsToolbar";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  onRenameTitle?: (newName: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  sortOptions: DropdownItem[];
  selectedSortKey: string;
  sortDirection: SortDirection;
  onSortChange?: (key: string) => void;
  onToggleSortDirection: () => void;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  children: React.ReactNode;
}

export const ModalWithToolbar: React.FC<Props> = ({
  open,
  onClose,
  title,
  onRenameTitle,
  search,
  onSearchChange,
  sortOptions,
  selectedSortKey,
  sortDirection,
  onSortChange,
  onToggleSortDirection,
  primaryAction,
  secondaryActions,
  children
}) => {
  const editableTitleContent = onRenameTitle ? (
    <InlineEditableText
      value={title}
      onSave={(newName) => onRenameTitle(newName)}
      inputClassName="font-bold"
      className="w-full"
    >
      <Text
        color="glyph-primary"
        select="none"
        variant="md"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {title}
      </Text>
    </InlineEditableText>
  ) : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={onRenameTitle ? undefined : title}
      titleContent={editableTitleContent}
      width="md"
      fullHeight
    >
      <div className="flex flex-col flex-1 min-h-0">
        <div className="pb-1">
          <ShotsToolbar
            search={search}
            onSearchChange={onSearchChange}
            sortOptions={sortOptions}
            selectedSortKey={selectedSortKey}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
            onToggleSortDirection={onToggleSortDirection}
            primaryAction={primaryAction}
            secondaryActions={secondaryActions}
          />
        </div>
        <div className="flex-1 min-h-0 flex flex-col pt-2">{children}</div>
      </div>
    </Modal>
  );
};
