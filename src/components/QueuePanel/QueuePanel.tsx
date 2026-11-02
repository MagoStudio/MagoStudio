import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Text } from "@components/Text";
import { useQueueItems } from "@hooks/queue/useQueueItems";
import { AssetStatus } from "@schemas/asset";
import { Dialog } from "react-aria-components/Dialog";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";

import { QueueSection } from "./QueueSection";

interface QueuePanelProps {
  onClose: () => void;
}

export const QueuePanel: React.FC<QueuePanelProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { queueItems } = useQueueItems();

  const inProgressItems = queueItems?.filter(
    (item) => item.status === AssetStatus.INPROGRESS
  );

  const waitingItems = queueItems?.filter(
    (item) =>
      item.status === AssetStatus.PENDING || item.status === AssetStatus.INQUEUE
  );

  const completedItems = queueItems
    ?.filter(
      (item) =>
        item.status === AssetStatus.FINISHED ||
        item.status === AssetStatus.ERROR
    )
    .sort(
      (a, b) =>
        new Date(b.finished_at).getTime() - new Date(a.finished_at).getTime()
    );

  useHotkeys("escape", () => onClose(), { enabled: true }, [onClose]);

  return (
    <div data-testid="drawer-isolate-root" className="isolate">
      <div
        data-testid="drawer-scrim"
        className="fixed inset-0 z-0"
        onMouseDown={onClose}
        aria-hidden="true"
      />
      <div
        data-testid="queue-panel"
        className="absolute right-0 top-14 bottom-2 z-10 w-[672px] flex flex-col bg-surface-secondary-opacity-90 backdrop-blur-[10px] rounded-[20px] shadow-[0px_0px_16px_0px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        <Dialog
          aria-label={t("queue_panel.title.label")}
          className="outline-hidden h-full flex flex-col"
        >
          <div className="flex items-center gap-2 pl-4 pr-3 py-4 shrink-0">
            <Text
              component="p"
              variant="md"
              weight="bold"
              color="glyph-primary"
              className="flex-1"
            >
              {t("queue_panel.title.label")}
            </Text>
            <IconActionButton
              icon={<Icon iconSet="24" iconName="close" />}
              size="sm"
              onPress={onClose}
              aria-label={t("actions.close.label")}
              className="shrink-0"
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom px-4 pb-4">
            <div className="flex flex-col gap-6">
              <QueueSection
                title={t("queue_panel.section_in_progress.label")}
                emptyText={t("queue_panel.empty_in_progress.label")}
                items={inProgressItems}
                onClose={onClose}
              />

              <QueueSection
                title={t("queue_panel.section_waiting.label")}
                emptyText={t("queue_panel.empty_waiting.label")}
                items={waitingItems}
                onClose={onClose}
              />

              <QueueSection
                title={t("queue_panel.section_completed.label")}
                subtitle={t("queue_panel.history_notice.label")}
                items={completedItems}
                onClose={onClose}
              />
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
};
