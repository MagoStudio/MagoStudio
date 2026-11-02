import { BalanceWithComputedFields } from "@domains/payment/interface";

export const selectMaxFrameRange = (
  data: BalanceWithComputedFields
): number | undefined =>
  data.latest_subscription.features.maximum_frame_range ?? undefined;
