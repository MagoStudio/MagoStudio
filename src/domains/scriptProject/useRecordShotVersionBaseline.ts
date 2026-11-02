import { useEffect } from "react";

import { useProjectCut } from "./data/useProjectCut";
import { useShotVersionReview } from "./useShotVersionReview";
import { listFinishedCutShotVersionIds } from "./utils/listFinishedCutShotVersionIds";

export const useRecordShotVersionBaseline = (projectId: string) => {
  const { data: cut } = useProjectCut(projectId);
  const {
    isReviewStorageReady,
    isVersionBaselineRecorded,
    recordVersionBaseline
  } = useShotVersionReview(projectId);
  const shouldRecordVersionBaseline =
    isReviewStorageReady && !isVersionBaselineRecorded;

  // oxlint-disable-next-line custom-react/no-use-effect -- external sync: writes the baseline to localStorage once the signed-in user and the cut have both loaded, which can happen after mount
  useEffect(() => {
    if (!shouldRecordVersionBaseline || !cut) return;
    recordVersionBaseline(listFinishedCutShotVersionIds(cut));
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- recordVersionBaseline is read fresh each run; the record fires once per readiness change
  }, [shouldRecordVersionBaseline, cut]);
};
