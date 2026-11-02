export const resolveImageToVideoDisabledReason = ({
  hasSelectedProject,
  validationErrorMessage,
  isModelNotAllowedInMode,
  missingProjectMessage,
  modelNotAllowedInModeMessage
}: {
  hasSelectedProject: boolean;
  validationErrorMessage: string | undefined;
  isModelNotAllowedInMode: boolean;
  missingProjectMessage: string;
  modelNotAllowedInModeMessage: string;
}): string | undefined => {
  if (!hasSelectedProject) return missingProjectMessage;
  if (validationErrorMessage) return validationErrorMessage;
  if (isModelNotAllowedInMode) return modelNotAllowedInModeMessage;
  return undefined;
};
