export const resolveSettledAssetResults = <T>(
  settledResults: PromiseSettledResult<T>[]
): (T | undefined)[] =>
  settledResults.map((settledResult) =>
    settledResult.status === "fulfilled" ? settledResult.value : undefined
  );
