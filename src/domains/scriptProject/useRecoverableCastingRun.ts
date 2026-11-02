export type RecoverableCastingRun = {
  planId: string;
  status: string;
};

/** The vanilla web app currently tracks a launched run in page-local state.
 * Desktop supplies a local override backed by its durable project snapshot. */
export const useRecoverableCastingRun = (
  _projectId: string
): RecoverableCastingRun | null => null;
