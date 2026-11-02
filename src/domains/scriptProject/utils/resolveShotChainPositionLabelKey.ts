const CHAIN_START_LABEL_KEY = "script_project.sequential_chain_start.label";

const CONTINUES_FROM_LABEL_KEY = "script_project.sequential_source_shot.label";

export const resolveShotChainPositionLabelKey = ({
  isSequentialEnabled
}: {
  isSequentialEnabled: boolean;
}): string => {
  if (!isSequentialEnabled) return CHAIN_START_LABEL_KEY;
  return CONTINUES_FROM_LABEL_KEY;
};
