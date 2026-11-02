const SCRIPT_PROJECT_ROUTE = "/script-project";

export const buildScriptProjectHref = (projectId: string): string =>
  `${SCRIPT_PROJECT_ROUTE}?projectId=${encodeURIComponent(projectId)}`;
