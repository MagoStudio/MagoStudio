import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { useBulkRendersRunsAcrossProjects } from "@domains/bulkRendersRun/useBulkRendersRuns";
import { splitBulkRendersRunListBySection } from "@domains/bulkRendersRun/utils/splitBulkRendersRunListBySection";
import { bulkRenderingFlowAtom } from "@store/atoms";
import { useSetAtom } from "jotai";
import { Heading } from "react-aria-components/Dialog";
import { useTranslation } from "react-i18next";

import { BulkRenderingHistoryRowContainer } from "./BulkRenderingHistoryRowContainer";
import { BulkRenderingInProgressRowContainer } from "./BulkRenderingInProgressRowContainer";
import { BulkRenderingPanelSection } from "./BulkRenderingPanelSection";

interface Props {
  onClose: () => void;
  expandedHistoryRunId: string | undefined;
}

export const BulkRenderingPanel: React.FC<Props> = ({
  onClose,
  expandedHistoryRunId
}) => {
  const { t } = useTranslation();
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);
  const { data: runs } = useBulkRendersRunsAcrossProjects();
  const { inProgressRuns, historyRuns } = splitBulkRendersRunListBySection({
    runs: runs ?? []
  });

  const onActivateInProgressRow = (bulkRunId: string) => {
    setBulkRenderingFlow({ view: "run", bulkRunId });
  };

  return (
    <OverlayDialog
      isOpen
      onOpenChange={onClose}
      size={{ mode: "inset", insetXPx: 32, insetYPx: 56 }}
      className="overflow-hidden"
    >
      <div className="flex h-full w-full flex-col">
        <div className="relative flex h-14 shrink-0 items-center justify-between pl-4 pr-3 py-4 shadow-[0px_0px_8px_0px_rgba(0,0,0,0.6)]">
          <Heading slot="title" className="contents">
            <Text
              component="span"
              variant="md"
              weight="bold"
              color="glyph-primary"
            >
              {t("bulk_rendering.panel_title.label")}
            </Text>
          </Heading>
          <IconActionButton
            icon={<Icon iconSet="24" iconName="close" />}
            size="sm"
            variant="transparent"
            onPress={onClose}
            aria-label={t("bulk_rendering.panel_close_button.ariaLabel")}
            className="shrink-0"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-custom px-4 pb-4">
          <div className="flex flex-col gap-6">
            <BulkRenderingPanelSection
              title={t("bulk_rendering.panel_section_in_progress.label")}
              emptyText={t("bulk_rendering.panel_empty_in_progress.label")}
              hasRows={inProgressRuns.length > 0}
              data-testid="bulk-rendering-panel-section-in-progress"
            >
              {inProgressRuns.map((run) => (
                <BulkRenderingInProgressRowContainer
                  key={run.id}
                  run={run}
                  onActivate={onActivateInProgressRow}
                />
              ))}
            </BulkRenderingPanelSection>

            <BulkRenderingPanelSection
              title={t("bulk_rendering.panel_section_history.label")}
              emptyText={t("bulk_rendering.panel_empty_history.label")}
              hasRows={historyRuns.length > 0}
              data-testid="bulk-rendering-panel-section-history"
            >
              {historyRuns.map((run) => (
                <BulkRenderingHistoryRowContainer
                  key={run.id}
                  run={run}
                  isInitiallyExpanded={run.id === expandedHistoryRunId}
                />
              ))}
            </BulkRenderingPanelSection>
          </div>
        </div>
      </div>
    </OverlayDialog>
  );
};
