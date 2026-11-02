import { useBalance } from "@domains/payment/useBalance";
import {
  BulkRendersRun,
  BulkRendersRunDetailShotOverride,
  BulkRendersRunStep
} from "@schemas/bulkRendersRun";

import { estimateBulkRendersRunRemainingCredits } from "./utils/estimateBulkRendersRunRemainingCredits";
import { resolveBulkRendersRunRemainingShotIds } from "./utils/resolveBulkRendersRunRemainingShotIds";
import { resolveIsBulkRendersRunBalanceSufficient } from "./utils/resolveIsBulkRendersRunBalanceSufficient";

export interface BulkRendersRunRemainingCredits {
  estimatedRemainingCredits: number;
  couldNotBePriced: boolean;
  isBalanceSufficientForRemainder: boolean;
}

export const useBulkRendersRunRemainingCredits = ({
  run,
  steps,
  shotOverridesById
}: {
  run: BulkRendersRun;
  steps: BulkRendersRunStep[];
  shotOverridesById:
    | Record<string, BulkRendersRunDetailShotOverride>
    | undefined;
}): BulkRendersRunRemainingCredits => {
  const { data: balance } = useBalance();

  const shotIds = run.input_settings?.timeline_ids ?? [];
  const { shotIdsOwingImageRender, shotIdsOwingVideoRender } =
    resolveBulkRendersRunRemainingShotIds({ shotIds, steps });

  const { estimatedRemainingCredits, couldNotBePriced } =
    estimateBulkRendersRunRemainingCredits({
      videoSettings: run.input_settings?.video_settings ?? undefined,
      imageSettings: run.input_settings?.img2img_settings ?? undefined,
      shotOverridesById,
      shotIdsOwingImageRender,
      shotIdsOwingVideoRender
    });

  const isBalanceSufficientForRemainder =
    resolveIsBulkRendersRunBalanceSufficient({
      couldNotBePriced,
      balanceAmount: balance?.amount,
      estimatedRemainingCredits
    });

  return {
    estimatedRemainingCredits,
    couldNotBePriced,
    isBalanceSufficientForRemainder
  };
};
