import { RenderMode } from "@hooks/types";

const CANONICAL_WIRE_PIN_FRAME_RANGE_END = 72;

export const baseRenderPayloadInput = {
  parentLayerId: "layer-mago-wire-pin",
  frameRange: [0, CANONICAL_WIRE_PIN_FRAME_RANGE_END],
  inputTrackId: "video-mago-wire-pin",
  renderEngine: "magov2",
  renderMode: RenderMode.CREDITS,
  inputVideoWidth: 1280,
  inputVideoHeight: 720,
  fps: 24
};
