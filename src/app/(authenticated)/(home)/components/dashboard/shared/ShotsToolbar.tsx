"use client";

import { Dropdown, DropdownItem } from "@components/Dropdown";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import type { SortDirection } from "@domains/project/shotFolders/useShotFoldersSorting";
import { SearchInput } from "@home/components/dashboard/shared/SearchInput";
import clsx from "clsx";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ShotsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortOptions: DropdownItem[];
  selectedSortKey: string;
  sortDirection: SortDirection;
  onSortChange?: (key: string) => void;
  onToggleSortDirection: () => void;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
}

export const ShotsToolbar: React.FC<ShotsToolbarProps> = ({
  search,
  onSearchChange,
  sortOptions,
  selectedSortKey,
  sortDirection,
  onSortChange,
  onToggleSortDirection,
  primaryAction,
  secondaryActions
}) => {
  const { t } = useTranslation();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const isSearchActive = isSearchFocused || search.length > 0;

  return (
    <div className="flex items-center w-full gap-1 min-h-8">
      <div className="flex flex-1 min-w-0 items-center gap-1">
        <div className="flex-1 min-w-0">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            onFocusChange={setIsSearchFocused}
          />
        </div>
        <Dropdown
          aria-label="Sort shots by"
          items={sortOptions}
          selectedKey={selectedSortKey}
          onSelectionChange={(key) => onSortChange?.(String(key))}
          className="shrink-0 w-[140px]"
          data-testid="sort-field-trigger"
        />
        <IconActionButton
          icon={
            <Icon
              iconSet="16"
              iconName={sortDirection === "asc" ? "order-az" : "order-za"}
            />
          }
          size="sm"
          variant="dark"
          onPress={onToggleSortDirection}
          aria-label={
            sortDirection === "asc"
              ? t("actions.sort_ascending.label")
              : t("actions.sort_descending.label")
          }
        />
      </div>
      {(primaryAction || secondaryActions) && (
        <div
          aria-hidden={isSearchActive}
          inert={isSearchActive}
          className={clsx(
            "flex items-center gap-1 shrink-0 overflow-hidden",
            "transition-[max-width,opacity,margin] duration-200 ease-out",
            isSearchActive
              ? "max-w-0 opacity-0 -ml-1 pointer-events-none"
              : "max-w-[400px] opacity-100"
          )}
        >
          {secondaryActions}
          {primaryAction}
        </div>
      )}
    </div>
  );
};
