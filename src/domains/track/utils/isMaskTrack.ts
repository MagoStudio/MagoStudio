import { isMaskModel } from "@domains/renders/utils/isMaskModel";
import { getTrackRenderSettings } from "@domains/track/utils/getTrackRenderSettings";
import { Layer } from "@schemas/layer";

export const isMaskTrack = (track: Layer): boolean =>
  isMaskModel(getTrackRenderSettings(track)?.mago_engine as string | undefined);
