/** The steps that generate a Shot's first frame.
 *
 * `use_provided_reference_frame` is deliberately absent. It is what the backend runs *instead of*
 * this chain when a Shot supplies its own frame — it registers that asset and skips every
 * img2img step. Counting it as image work made such a Shot report the image phase, and through
 * the aggregate's image-first precedence made the whole run report it, while no image was being
 * generated at all. A Shot that supplies its frame has no image work, so its image chain is
 * empty. */
export const IMAGE_CHAIN_TOOL_NAMES = new Set([
  "adapt_prompt_img",
  "submit_img2img",
  "poll_img2img",
  "submit_img_metrics",
  "poll_img_metrics",
  "img_quality_gate",
  "poll_img_retry",
  "img_quality_final"
]);

export const VIDEO_CHAIN_TOOL_NAMES = new Set([
  "create_render_layer",
  "submit_video_render",
  "poll_video_render",
  "submit_vid_metrics",
  "poll_vid_metrics",
  "vid_quality_gate",
  "poll_vid_retry"
]);

export const VIDEO_QUALITY_METRICS_POLL_TOOL_NAME = "poll_vid_metrics";

export const VIDEO_QUALITY_MEASUREMENT_TOOL_NAMES = new Set([
  "submit_vid_metrics",
  VIDEO_QUALITY_METRICS_POLL_TOOL_NAME
]);
