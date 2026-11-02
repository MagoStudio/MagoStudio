import { useBalance } from "@domains/payment/useBalance";
import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { useUser } from "@platform/identity";
import { useTranslation } from "react-i18next";

import { buildUserSectionCopyText } from "./buildUserSectionCopyText";
import { DebugInfoRow } from "./DebugInfoRow";
import { DebugInfoSection } from "./DebugInfoSection";

const PLACEHOLDER = "—";

export function DebugInfoUserSection() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { data: balanceData } = useBalance();
  const { subscriptionType } = useCurrentSubscription();

  const userId = user?.id ?? PLACEHOLDER;
  const email = user?.emailAddresses[0]?.emailAddress ?? PLACEHOLDER;
  const credits = String(balanceData?.amount ?? PLACEHOLDER);
  const reserved = String(balanceData?.reserved_amount ?? PLACEHOLDER);
  const subscription = subscriptionType ?? PLACEHOLDER;
  const rendersImg2Img =
    balanceData?.renders_in_progress?.credits?.img2img ?? 0;
  const rendersVideo = balanceData?.renders_in_progress?.credits?.video ?? 0;
  const rendersUnlimitedImg2Img =
    balanceData?.renders_in_progress?.unlimited?.img2img ?? 0;
  const rendersUnlimitedVideo =
    balanceData?.renders_in_progress?.unlimited?.video ?? 0;
  const renders = `img2img: ${rendersImg2Img + rendersUnlimitedImg2Img}, video: ${rendersVideo + rendersUnlimitedVideo}`;

  const copyText = buildUserSectionCopyText(t, {
    user,
    balanceData,
    subscriptionType
  });

  return (
    <DebugInfoSection
      title={t("titles.user_subscription.label")}
      copyText={copyText}
    >
      <DebugInfoRow label={t("titles.user_id.label")} value={userId} />
      <DebugInfoRow label={t("titles.user_email.label")} value={email} />
      <DebugInfoRow label={t("titles.credit_balance.label")} value={credits} />
      <DebugInfoRow
        label={t("titles.reserved_credits.label")}
        value={reserved}
      />
      <DebugInfoRow
        label={t("titles.subscription_status.label")}
        value={subscription}
      />
      <DebugInfoRow
        label={t("titles.renders_in_progress.label")}
        value={renders}
      />
    </DebugInfoSection>
  );
}
