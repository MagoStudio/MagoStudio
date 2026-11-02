import { bulkRenderingFlowAtom } from "@store/atoms";
import { useAtomValue } from "jotai";

import { BulkRenderingDraftModal } from "./BulkRenderingDraftModal";

export const BulkRenderingDraftModalHost: React.FC = () => {
  const bulkRenderingFlow = useAtomValue(bulkRenderingFlowAtom);

  if (bulkRenderingFlow?.view !== "draft") return null;

  return <BulkRenderingDraftModal draft={bulkRenderingFlow} />;
};
