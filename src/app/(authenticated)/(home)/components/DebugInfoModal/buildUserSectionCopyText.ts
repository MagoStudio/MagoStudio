import type { Balance } from "@schemas/balance";

const PLACEHOLDER = "—";

interface UserSectionData {
  user:
    | { id: string; emailAddresses: { emailAddress: string }[] }
    | null
    | undefined;
  balanceData: Balance | undefined;
  subscriptionType: string | undefined;
}

export function buildUserSectionCopyText(
  t: (key: string) => string,
  { user, balanceData, subscriptionType }: UserSectionData
): string {
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

  return [
    `## ${t("titles.user_subscription.label")}`,
    `${t("titles.user_id.label")}: ${userId}`,
    `${t("titles.user_email.label")}: ${email}`,
    `${t("titles.credit_balance.label")}: ${credits}`,
    `${t("titles.reserved_credits.label")}: ${reserved}`,
    `${t("titles.subscription_status.label")}: ${subscription}`,
    `${t("titles.renders_in_progress.label")}: ${renders}`
  ].join("\n");
}
