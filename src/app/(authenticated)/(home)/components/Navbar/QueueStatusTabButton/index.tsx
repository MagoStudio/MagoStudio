/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { SidebarMenuButton } from "@components/SidebarMenuButton";
import { StatusIndicator } from "@home/components/status/StatusIndicator";
import { useQueueStatusCount } from "@hooks/queue/useQueueStatusCount";
import { useMountEffect } from "@hooks/useMountEffect";
import { AssetStatus } from "@schemas/asset";
import { getNotificationSoundPath } from "@utils/notificationSound";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  onClick: () => void;
  isSelected: boolean;
}

const DEFAULT_TITLE = "Mago.studio";

export const QueueStatusTabButton: React.FC<Props> = ({
  onClick,
  isSelected
}) => {
  const { t } = useTranslation();
  const queueStatusCounts = useQueueStatusCount();

  const prevCountsRef = useRef<{ done?: number; error?: number } | null>(null);
  const customTitleRef = useRef<boolean>(false);

  useMountEffect(() => {
    const handleVisibilityChange = () => {
      const isFocused = !document.hidden;
      if (isFocused && customTitleRef.current) {
        document.title = DEFAULT_TITLE;
        customTitleRef.current = false;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  });

  useEffect(() => {
    if (!queueStatusCounts) {
      return;
    }

    if (queueStatusCounts.isInitialLoading) {
      return;
    }

    const newDone = queueStatusCounts.done ?? 0;
    const newError = queueStatusCounts.error ?? 0;

    if (prevCountsRef.current === null) {
      prevCountsRef.current = { done: newDone, error: newError };
      return;
    }

    const prevDone = prevCountsRef.current.done ?? 0;
    const prevError = prevCountsRef.current.error ?? 0;

    const shouldNotifyNewDone =
      newDone > 0 && prevDone > 0 && newDone > prevDone;
    const shouldNotifyNewError =
      newError > 0 && prevError > 0 && newError > prevError;

    prevCountsRef.current = { done: newDone, error: newError };

    if (shouldNotifyNewDone) {
      new Notification(t("notifications.render_finished_title.description"), {
        body: t("notifications.render_finished_body.description"),
        icon: "/favicon.ico"
      });
      const audio = new Audio(getNotificationSoundPath());
      audio.play().catch(() => {});
      if (document.hidden) {
        document.title = t("notifications.render_finished_tab.description");
        customTitleRef.current = true;
      }
    }

    if (shouldNotifyNewError) {
      new Notification(t("notifications.render_failed_title.description"), {
        body: t("notifications.render_failed_body.description"),
        icon: "/favicon.ico"
      });
      const audio = new Audio(getNotificationSoundPath());
      audio.play().catch(() => {});
      if (document.hidden) {
        document.title = t("notifications.render_failed_tab.description");
        customTitleRef.current = true;
      }
    }
  }, [queueStatusCounts, t]);

  if (!queueStatusCounts) {
    return (
      <SidebarMenuButton
        aria-label="Open Queue"
        onClick={onClick}
        selected={isSelected}
      >
        {t("titles.queue.label")}
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuButton
      aria-label="Open Queue"
      onClick={onClick}
      selected={isSelected}
    >
      <div className="flex items-center gap-2">
        Queue
        <div className="flex items-center gap-1">
          {queueStatusCounts.done && queueStatusCounts.done > 0 && (
            <span className="flex items-center text-glyph-success">
              <span className="-mr-0.5">{queueStatusCounts.done}</span>
              <span className="flex size-4 items-center justify-center">
                <StatusIndicator status={AssetStatus.FINISHED} />
              </span>
            </span>
          )}
          {queueStatusCounts.inProgress && queueStatusCounts.inProgress > 0 && (
            <span className="flex items-center text-glyph-warning">
              <span className="-mr-0.5">{queueStatusCounts.inProgress}</span>
              <span className="flex size-4 items-center justify-center">
                <StatusIndicator status={AssetStatus.INPROGRESS} />
              </span>
            </span>
          )}
          {queueStatusCounts.waiting && queueStatusCounts.waiting > 0 && (
            <span className="flex items-center text-glyph-primary">
              <span className="-mr-0.5">{queueStatusCounts.waiting}</span>
              <span className="flex size-4 items-center justify-center">
                <StatusIndicator status={AssetStatus.INQUEUE} />
              </span>
            </span>
          )}
          {queueStatusCounts.error && queueStatusCounts.error > 0 && (
            <span className="flex items-center text-glyph-error">
              <span className="-mr-0.5">{queueStatusCounts.error}</span>
              <span className="flex size-4 items-center justify-center">
                <StatusIndicator status={AssetStatus.ERROR} />
              </span>
            </span>
          )}
        </div>
      </div>
    </SidebarMenuButton>
  );
};
