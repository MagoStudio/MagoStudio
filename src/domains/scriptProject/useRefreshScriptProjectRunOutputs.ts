/** The web app refreshes runs it launched in the current page instance.
 * Desktop supplies a local override that also observes durable background runs
 * after the project has been closed and reopened. */
export const useRefreshScriptProjectRunOutputs = (
  _projectId: string | null | undefined
): void => {};
