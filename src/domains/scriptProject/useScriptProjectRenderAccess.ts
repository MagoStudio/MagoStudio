/** The web app always owns the render providers used by script-shot projects. */
export const useScriptProjectRenderAccess = (
  _projectId?: string,
  _sheetRenderModel?: string
): boolean => true;
