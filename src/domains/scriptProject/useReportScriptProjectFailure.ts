import { useHandleRenderSubmitError } from "@domains/renders/useHandleRenderSubmitError";
import { useToast } from "@store/useToast";

import { readValidationErrorMessage } from "./utils/readValidationErrorMessage";

/** Tells the user a script-to-shots action failed.
 *
 * Render submissions go through the shared handler first, so an unavailable mode, an inactive
 * subscription, a relaxed-mode limit and a max-render-count rejection each say what they say
 * everywhere else in the application. A rejected edit is then shown in the backend's own words,
 * because only it knows which cap was hit and by how much. Anything left falls back to a message
 * naming the action. */
export const useReportScriptProjectFailure = () => {
  const { showErrorToast } = useToast();
  const handleRenderSubmitError = useHandleRenderSubmitError({
    showRefusalToast: (message) => showErrorToast({ message })
  });

  return (error: unknown, fallbackMessage: string, retry?: () => void) => {
    if (handleRenderSubmitError(error)) return;

    const validationMessage = readValidationErrorMessage(error);
    if (validationMessage) {
      showErrorToast({ message: validationMessage });
      return;
    }

    showErrorToast({ message: fallbackMessage, onRetry: retry });
  };
};
