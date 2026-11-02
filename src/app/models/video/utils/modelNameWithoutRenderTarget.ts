/** The Local/Cloud switch already identifies the target in the model list. */
export const modelNameWithoutRenderTarget = (displayName: string): string =>
  displayName.replace(/\s*\((?:local|cloud)\)\s*$/i, "");
