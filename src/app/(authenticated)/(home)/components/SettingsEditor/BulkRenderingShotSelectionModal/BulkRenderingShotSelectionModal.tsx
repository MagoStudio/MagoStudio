import { Checkbox } from "@components/Checkbox";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { MainButton } from "@components/MainButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { useOpenBulkRenderingDraft } from "@domains/bulkRendersRun/useOpenBulkRenderingDraft";
import { useProjectShotFolders } from "@domains/project/shotFolders/useProjectShotFolders";
import { buildShotFolderTree } from "@domains/project/shotFolders/utils/buildShotFolderTree";
import { collectShotIdsFromTree } from "@domains/project/shotFolders/utils/collectShotIdsFromTree";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useTimelineList } from "@domains/project/useTimelineList";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { bulkRenderingFlowAtom } from "@store/atoms";
import { useSetAtom } from "jotai";
import { Heading } from "react-aria-components/Dialog";
import { useTranslation } from "react-i18next";

import { BulkRenderingShotList } from "./BulkRenderingShotList";
import { useBulkRenderingShotSelection } from "./hooks/useBulkRenderingShotSelection";

const FOOTER_BUTTON_WIDTH = "w-[175px]";

export function BulkRenderingShotSelectionModal() {
  const { t } = useTranslation();
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);
  const selectedProjectId = useSelectedProjectId();
  const {
    data: { shotFoldersAndShots }
  } = useProjectShotFolders(selectedProjectId);
  const { thumbnailUrlById, isLoading: isThumbnailListLoading } =
    useTimelineList(selectedProjectId);
  const { selectedShotId: openShotId } = useSelectedShotId();

  const tree = buildShotFolderTree(shotFoldersAndShots);
  const allShotIds = collectShotIdsFromTree(tree);
  const {
    isShotSelected,
    toggleShot,
    selectAll,
    clearAll,
    areAllShotsSelected,
    selectedCount
  } = useBulkRenderingShotSelection(allShotIds);

  const openBulkRenderingDraft = useOpenBulkRenderingDraft();

  const closeModal = () => setBulkRenderingFlow(null);
  const toggleSelectAll = () =>
    areAllShotsSelected ? clearAll() : selectAll();
  const pressNext = () => openBulkRenderingDraft();

  const isNextDisabled = selectedCount === 0;

  return (
    <OverlayDialog
      isOpen
      onOpenChange={closeModal}
      size={{ mode: "fixed", widthPx: 1024, heightPx: 743 }}
      className="overflow-hidden"
    >
      <div className="relative flex h-full w-full flex-col">
        <div className="shrink-0 shadow-[0px_0px_8px_0px_rgba(0,0,0,0.6)]">
          <div className="flex h-14 items-center gap-2 py-4 pl-4 pr-3">
            <Heading slot="title" className="contents">
              <Text
                component="span"
                variant="md"
                weight="bold"
                color="glyph-primary"
                className="flex-1"
              >
                {t("bulk_rendering.shot_selection_title.label")}
              </Text>
            </Heading>
            <IconActionButton
              icon={<Icon iconSet="24" iconName="close" />}
              size="sm"
              variant="transparent"
              onPress={closeModal}
              aria-label={t(
                "bulk_rendering.shot_selection_close_button.ariaLabel"
              )}
              className="shrink-0"
            />
          </div>

          <button
            type="button"
            aria-pressed={areAllShotsSelected}
            onClick={toggleSelectAll}
            className="group flex h-11 w-full items-center gap-1.5 px-4"
          >
            <span aria-hidden className="shrink-0">
              <Checkbox isChecked={areAllShotsSelected} isPresentational />
            </span>
            <Text component="span" variant="sm" color="glyph-secondary">
              {t("bulk_rendering.shot_selection_select_all.label")}
            </Text>
          </button>
        </div>

        <div
          data-testid="bulk-rendering-shot-selection-body"
          className="scrollbar-custom min-h-0 flex-1 overflow-y-auto py-2 pl-4 pr-5"
        >
          <BulkRenderingShotList
            tree={tree}
            thumbnailUrlById={thumbnailUrlById}
            isThumbnailListLoading={isThumbnailListLoading}
            openShotId={openShotId}
            isShotSelected={isShotSelected}
            onToggleShot={toggleShot}
          />
        </div>

        <div
          data-testid="bulk-rendering-shot-selection-footer"
          className="absolute inset-x-0 bottom-0 flex h-14 items-center justify-between bg-surface-secondary px-4 py-3 shadow-[0px_0px_16px_0px_rgba(0,0,0,0.6)]"
        >
          <Text component="span" variant="sm" color="glyph-secondary">
            {t("titles.shots_count.label", { count: selectedCount })}
          </Text>
          <div className="flex items-center gap-2">
            <MainButton
              colorScheme="secondary"
              className={FOOTER_BUTTON_WIDTH}
              onPress={closeModal}
            >
              {t("bulk_rendering.shot_selection_cancel_button.label")}
            </MainButton>
            <MainButton
              colorScheme="primary"
              className={FOOTER_BUTTON_WIDTH}
              isDisabled={isNextDisabled}
              onPress={pressNext}
            >
              {t("bulk_rendering.shot_selection_next_button.label")}
            </MainButton>
          </div>
        </div>
      </div>
    </OverlayDialog>
  );
}
