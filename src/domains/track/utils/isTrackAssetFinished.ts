import { AssetStatus } from "@schemas/asset";
import { Layer } from "@schemas/layer";

import { getTrackAssetData } from "./getTrackAssetData";

export const isTrackAssetFinished = (track: Layer | undefined): boolean =>
  getTrackAssetData(track)?.queue_status === AssetStatus.FINISHED;
