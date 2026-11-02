import { CircularProgress } from "@components/CircularProgress";
import { GhostButton } from "@components/GhostButton";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useProjectShotFolders } from "@domains/project/shotFolders/useProjectShotFolders";
import { collectLeafShotIds } from "@domains/project/utils/collectLeafShotIds";
import { useProjectShotsToolbar } from "@home/components/dashboard/hooks/useProjectShotsToolbar";
import { ModalWithToolbar } from "@home/components/dashboard/ModalWithToolbar";
import { useTranslation } from "react-i18next";

import { PlanShotTree } from "./PlanShotTree";

interface Props {
  onClose: () => void;
  projectId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export const PlanShotPickerModal: React.FC<Props> = ({
  onClose,
  projectId,
  selectedIds,
  onChange
}) => {
  const { t } = useTranslation();
  const { data, isLoading } = useProjectShotFolders(projectId);
  const {
    search,
    setSearch,
    sortOptions,
    selectedSortKey,
    handleSortChange,
    sortDirection,
    toggleSortDirection,
    sortItems,
    hasContent
  } = useProjectShotsToolbar(projectId);

  const allItems = data?.shotFoldersAndShots ?? [];
  const allLeafShotIds = collectLeafShotIds(
    allItems.map((item) => item.id),
    allItems
  );
  const totalShotCount = allLeafShotIds.size;

  const selectedSet = new Set(selectedIds);
  const selectedShotCount = Array.from(allLeafShotIds).filter((id) =>
    selectedSet.has(id)
  ).length;

  const handleToggleShot = (id: string) => {
    onChange(
      selectedSet.has(id)
        ? selectedIds.filter((sid) => sid !== id)
        : [...selectedIds, id]
    );
  };

  const handleSetMany = (ids: string[], selected: boolean) => {
    if (selected) {
      onChange(Array.from(new Set([...selectedIds, ...ids])));
    } else {
      const removed = new Set(ids);
      onChange(selectedIds.filter((id) => !removed.has(id)));
    }
  };

  const handleSelectAll = () => onChange(Array.from(allLeafShotIds));
  const handleClear = () => onChange([]);

  return (
    <ModalWithToolbar
      open
      onClose={onClose}
      title={t("plan.shot_picker_title.label")}
      search={search}
      onSearchChange={setSearch}
      sortOptions={sortOptions}
      selectedSortKey={selectedSortKey}
      onSortChange={handleSortChange}
      sortDirection={sortDirection}
      onToggleSortDirection={toggleSortDirection}
    >
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <CircularProgress />
            </div>
          ) : hasContent ? (
            <PlanShotTree
              projectId={projectId}
              search={search}
              sortItems={sortItems}
              selectedIds={selectedSet}
              onToggleShot={handleToggleShot}
              onSetMany={handleSetMany}
            />
          ) : (
            <div className="flex items-center justify-center py-8">
              <Text variant="sm" color="glyph-secondary">
                {t("plan.no_timelines.label")}
              </Text>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 pt-3 shrink-0 border-t border-glyph-invert-main">
          <Text variant="sm" color="glyph-secondary">
            {t("plan.selected_count.label", {
              selected: selectedShotCount,
              total: totalShotCount
            })}
          </Text>
          <div className="flex items-center gap-1">
            <GhostButton
              size="sm"
              onPress={handleSelectAll}
              isDisabled={selectedShotCount === totalShotCount}
            >
              {t("plan.select_all.label")}
            </GhostButton>
            <GhostButton
              size="sm"
              onPress={handleClear}
              isDisabled={selectedIds.length === 0}
            >
              {t("plan.clear_selection.label")}
            </GhostButton>
            <MainButton size="md" onPress={onClose}>
              {t("plan.shot_picker_done.label")}
            </MainButton>
          </div>
        </div>
      </div>
    </ModalWithToolbar>
  );
};
