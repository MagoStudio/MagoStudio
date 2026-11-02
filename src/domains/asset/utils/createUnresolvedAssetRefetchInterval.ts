interface UnresolvedAssetQuery<TAssetData> {
  state: {
    status: "pending" | "error" | "success";
    data: TAssetData | undefined;
  };
}

export const createUnresolvedAssetRefetchInterval =
  <TAssetData>({
    pollIntervalMs,
    getPlayableUrl
  }: {
    pollIntervalMs: number;
    getPlayableUrl: (assetData: TAssetData | undefined) => string | undefined;
  }) =>
  (query: UnresolvedAssetQuery<TAssetData>): number | false => {
    if (query.state.status !== "success") return false;
    const isAssetResolved = !!getPlayableUrl(query.state.data);
    return isAssetResolved ? false : pollIntervalMs;
  };
