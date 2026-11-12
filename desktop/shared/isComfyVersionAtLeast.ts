const parseComfyVersion = (version: string): number[] | null => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
  return match ? match.slice(1).map(Number) : null;
};

export const isComfyVersionAtLeast = (
  reportedVersion: string,
  requiredVersion: string
): boolean | null => {
  const reported = parseComfyVersion(reportedVersion);
  const required = parseComfyVersion(requiredVersion);
  if (!reported || !required) return null;
  for (let index = 0; index < required.length; index++) {
    if (reported[index] !== required[index])
      return reported[index] > required[index];
  }
  return true;
};
