export const resolveSheetRenderBlockedReasonKey = ({
  isRunActive,
  isUploadingReference
}: {
  isRunActive: boolean;
  isUploadingReference: boolean;
}): string | null => {
  if (isUploadingReference)
    return "script_project.render_blocked_reference_uploading.label";
  if (isRunActive) return "script_project.render_blocked_run_active.label";
  return null;
};
