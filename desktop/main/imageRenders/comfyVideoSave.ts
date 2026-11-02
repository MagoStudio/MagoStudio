/** Matches the delivered H.264 master quality from MagoRenderer. */
export const LOCAL_VIDEO_RENDER_CRF = 20;

/**
 * Comfy V3 dynamic-combo inputs for an explicit H.264/CRF encode.
 * Dotted paths are expanded by Comfy into SaveVideo's nested format options.
 */
export const buildLocalVideoSaveInputs = ({
  filenamePrefix,
  videoNodeId
}: {
  filenamePrefix: string;
  videoNodeId: string;
}) => ({
  video: [videoNodeId, 0],
  filename_prefix: filenamePrefix,
  format: "auto",
  "format.codec": "h264",
  "format.codec.encoding": "re-encode",
  "format.codec.encoding.crf": LOCAL_VIDEO_RENDER_CRF
});
