export function isModelAllowedInRelaxedMode(
  allowedModels: string[],
  token: string
): boolean {
  return allowedModels.includes(token);
}
