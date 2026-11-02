import { useMutation } from "@tanstack/react-query";

import { resolveMirroredSourceVideoContext } from "../api/mirrorAdaptPromptReferencesToCloud";

export const useResolveMirroredSourceVideoContext = () =>
  useMutation({ mutationFn: resolveMirroredSourceVideoContext });
