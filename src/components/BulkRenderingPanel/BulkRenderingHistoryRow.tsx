import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { useMountEffect } from "@hooks/useMountEffect";
import { BulkRendersRun } from "@schemas/bulkRendersRun";
import { cn } from "@utils";
import { useRef, useState } from "react";
import {
  Button,
  Disclosure,
  DisclosurePanel,
  Heading
} from "react-aria-components";
import { useTranslation } from "react-i18next";

import { BulkRenderingHistoryRowShotTabs } from "./BulkRenderingHistoryRowShotTabs";
import { BulkRenderingHistoryRow as BulkRenderingHistoryRowData } from "./types";
import { getBulkRenderingHistoryRowErrorSummary } from "./utils/getBulkRenderingHistoryRowErrorSummary";
import { getBulkRenderingHistoryRowOutcome } from "./utils/getBulkRenderingHistoryRowOutcome";

interface Props {
  run: BulkRendersRun;
  row: BulkRenderingHistoryRowData;
  isInitiallyExpanded: boolean;
}

export const BulkRenderingHistoryRow: React.FC<Props> = ({
  run,
  row,
  isInitiallyExpanded
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  const [hasEverExpanded, setHasEverExpanded] = useState(isInitiallyExpanded);
  const errorSummary = getBulkRenderingHistoryRowErrorSummary(row);
  const runOutcome = getBulkRenderingHistoryRowOutcome(row.status);
  const disclosureRef = useRef<HTMLDivElement>(null);

  useMountEffect(() => {
    if (!isInitiallyExpanded) return;
    disclosureRef.current?.scrollIntoView({ block: "nearest" });
  });

  const onExpandedChange = (nextIsExpanded: boolean) => {
    setIsExpanded(nextIsExpanded);
    if (nextIsExpanded) setHasEverExpanded(true);
  };

  return (
    <Disclosure
      ref={disclosureRef}
      isExpanded={isExpanded}
      onExpandedChange={onExpandedChange}
      className="w-full rounded-lg bg-surface-primary"
    >
      <Heading level={3} className="contents">
        <Button
          slot="trigger"
          aria-label={t(
            "bulk_rendering.panel_row_toggle_history_row.ariaLabel",
            {
              runName: row.runName
            }
          )}
          className="flex w-full flex-col gap-1 p-4 text-left outline-none"
        >
          <div className="flex items-center justify-between gap-4">
            <Text
              variant="md"
              color="glyph-primary"
              className="leading-5 truncate"
            >
              {row.runName}
            </Text>
            <Icon
              iconSet="16"
              iconName="chevron-down"
              className={cn(
                "shrink-0 text-glyph-tertiary transition-transform duration-200",
                !isExpanded && "-rotate-90"
              )}
            />
          </div>
          {row.timestampLabel && (
            <Text variant="sm" color="glyph-tertiary">
              {row.timestampLabel}
            </Text>
          )}
          <div className="flex w-fit flex-wrap items-center gap-4">
            {runOutcome && (
              <Text
                variant="sm"
                color={runOutcome.tone}
                data-testid="bulk-rendering-history-row-outcome"
              >
                {t(runOutcome.labelKey)}
              </Text>
            )}
            {row.durationLabel && (
              <Text variant="sm" color="glyph-secondary">
                {t("bulk_rendering.panel_row_duration.label", {
                  duration: row.durationLabel
                })}
              </Text>
            )}
            {row.imageChainCompletedCount !== undefined &&
              row.imageTotalCount !== undefined && (
                <Text variant="sm" color="glyph-secondary">
                  {t("bulk_rendering.panel_row_images_stat.label", {
                    completed: row.imageChainCompletedCount,
                    total: row.imageTotalCount
                  })}
                </Text>
              )}
            {row.videoChainCompletedCount !== undefined &&
              row.videoTotalCount !== undefined && (
                <Text variant="sm" color="glyph-secondary">
                  {t("bulk_rendering.panel_row_videos_stat.label", {
                    completed: row.videoChainCompletedCount,
                    total: row.videoTotalCount
                  })}
                </Text>
              )}
            {errorSummary.status !== "unavailable" && (
              <Text
                data-testid="bulk-rendering-history-row-error-summary"
                variant="sm"
                color={
                  errorSummary.status === "present"
                    ? "glyph-error"
                    : "glyph-secondary"
                }
              >
                {errorSummary.status === "present"
                  ? t("bulk_rendering.panel_row_errors_present.label", {
                      imageErrors: errorSummary.imageErrorCount,
                      videoErrors: errorSummary.videoErrorCount
                    })
                  : t("bulk_rendering.panel_row_errors_none.label", {
                      count: 0
                    })}
              </Text>
            )}
          </div>
        </Button>
      </Heading>
      <DisclosurePanel className="flex flex-col gap-3 px-4 pb-4 pt-0 [&[hidden]]:hidden">
        {hasEverExpanded && <BulkRenderingHistoryRowShotTabs run={run} />}
      </DisclosurePanel>
    </Disclosure>
  );
};
