import { useMutation } from "@tanstack/react-query";

import { mirrorAdaptPromptReferencesToCloud } from "../api/mirrorAdaptPromptReferencesToCloud";

export const useMirrorAdaptPromptReferencesToCloud = () =>
  useMutation({ mutationFn: mirrorAdaptPromptReferencesToCloud });
