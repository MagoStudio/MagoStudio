import { Icon } from "@components/Icon";
import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import { useVersion } from "@domains/app/useVersion";
import { useBalance } from "@domains/payment/useBalance";
import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useQueueItemForTrack } from "@domains/queue/useQueueItemForTrack";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useSelectedTrackIds } from "@domains/track/useSelectedTrackIds";
import { useCopyToClipboard } from "@hooks/useCopyToClipboard";
import { useDebugInfoModal } from "@hooks/useDebugInfoModal";
import { useIsRawTeamMember } from "@hooks/userLocalStorage/useIsRawTeamMember";
import { useSubscriptionOverride } from "@hooks/useSubscriptionOverride";
import { useClerk, useUser } from "@platform/identity";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

import { buildAppSectionCopyText } from "./buildAppSectionCopyText";
import { buildOverridesSectionCopyText } from "./buildOverridesSectionCopyText";
import { buildProjectSectionCopyText } from "./buildProjectSectionCopyText";
import { buildUserSectionCopyText } from "./buildUserSectionCopyText";
import { DebugInfoAppSection } from "./DebugInfoAppSection";
import { DebugInfoOverridesSection } from "./DebugInfoOverridesSection";
import { DebugInfoProjectSection } from "./DebugInfoProjectSection";
import { DebugInfoUserSection } from "./DebugInfoUserSection";

export function DebugInfoModal() {
  const { t } = useTranslation();
  const { isOpen, close } = useDebugInfoModal();
  const isTeamMember = useIsRawTeamMember();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: balanceData } = useBalance();
  const { subscriptionType } = useCurrentSubscription();
  const projectId = useSelectedProjectId() ?? "—";
  const { selectedShotId } = useSelectedShotId();
  const selectedTrackIds = useSelectedTrackIds();
  const { data: queueItem, filepath } = useQueueItemForTrack({
    trackId: selectedTrackIds[0]
  });
  const { data: versionData } = useVersion();
  const {
    subscriptionOverride,
    isLegacyUserOverride,
    createdAtOverride,
    forceNonTeamMemberOverride,
    mockOnboardingIncompleteOverride,
    forceOnboardingCompleteOverride,
    forceOnboardingEnabledOverride,
    relaxedDayUsedPctOverride,
    relaxedDayResetAtOverride,
    relaxedWeekUsedPctOverride,
    relaxedWeekResetAtOverride
  } = useSubscriptionOverride();
  const { copyToClipboard } = useCopyToClipboard();

  const handleCopyAll = () => {
    const appVersion = versionData?.version || "—";

    const sections = [
      buildUserSectionCopyText(t, { user, balanceData, subscriptionType }),
      buildProjectSectionCopyText(t, {
        projectId,
        selectedShotId,
        selectedTrackIds,
        assetId: queueItem?.asset_id ?? "—",
        filepath: filepath || "—",
        queueId: queueItem?.id ?? "—"
      }),
      buildAppSectionCopyText(t, appVersion)
    ];

    if (isTeamMember) {
      sections.push(
        buildOverridesSectionCopyText(t, {
          subscriptionOverride,
          isLegacyUserOverride,
          createdAtOverride,
          forceNonTeamMemberOverride,
          mockOnboardingIncompleteOverride,
          forceOnboardingCompleteOverride,
          forceOnboardingEnabledOverride,
          relaxedDayUsedPctOverride,
          relaxedDayResetAtOverride,
          relaxedWeekUsedPctOverride,
          relaxedWeekResetAtOverride
        })
      );
    }

    void copyToClipboard(sections.join("\n\n"), false);
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title={t("titles.debug_info.label")}
      width="sm"
      widthClassName="w-screen md:min-w-[50rem] md:w-[50rem]"
      titleContent={
        <div className="flex items-center justify-between w-full">
          <Text variant="sm" weight="medium" color="glyph-primary">
            {t("titles.debug_info.label")}
          </Text>
          <AriaButton
            aria-label={t("buttonTooltips.copy_all_debug_info.label")}
            onPress={handleCopyAll}
            className="size-4 text-glyph-secondary data-[hovered]:text-glyph-primary outline-hidden"
          >
            <Icon iconSet="16" iconName="copy" />
          </AriaButton>
        </div>
      }
    >
      <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-3 scrollbar-custom">
        <DebugInfoUserSection />
        <DebugInfoProjectSection />
        <DebugInfoAppSection />
        {isTeamMember && <DebugInfoOverridesSection />}
      </div>
      {isTeamMember && (
        <div className="mt-4 flex items-center justify-end border-t border-glyph-stroke pt-3">
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/" })}
            className="rounded border border-glyph-stroke px-2 py-1 text-xs text-glyph-error hover:border-glyph-error"
          >
            {t("titles.sign_out.label")}
          </button>
        </div>
      )}
    </Modal>
  );
}
