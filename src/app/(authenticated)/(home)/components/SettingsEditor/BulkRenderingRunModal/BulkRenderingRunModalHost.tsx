import { bulkRenderingFlowAtom } from "@store/atoms";
import { useAtomValue } from "jotai";

import { BulkRenderingRunModal } from "./BulkRenderingRunModal";

export const BulkRenderingRunModalHost: React.FC = () => {
  const bulkRenderingFlow = useAtomValue(bulkRenderingFlowAtom);

  if (bulkRenderingFlow?.view !== "run") return null;

  return <BulkRenderingRunModal bulkRunId={bulkRenderingFlow.bulkRunId} />;
};
