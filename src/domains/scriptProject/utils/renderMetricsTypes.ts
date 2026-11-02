/** Images and videos are scored by two evaluators that store the same numbers under different
 * keys — the video one prefixes every field `vid_`, the img2img one does not. Both are read into
 * this one shape so a single badge can present either. */
export type RenderMetricsKind = "image" | "video";

/** Which judge ran. A sheet is generated from text, so it is scored against its prompt and the
 * four source-relative axes are absent rather than zero. The backend says which on the result;
 * never infer it from the keys. */
export type RenderMetricsEvalMode = string;

export type RenderMetricsAxisName =
  | "style"
  | "content"
  | "identity"
  | "lighting"
  | "quality"
  | "temporalStyle"
  | "temporalIdentity"
  | "promptAdherence"
  | "coherence"
  | "usability";

export type RenderMetrics = {
  status: string | null;
  evalMode: RenderMetricsEvalMode | null;
  score: number | null;
  hasEvaluatorPassed: boolean | null;
  scoreByAxis: Partial<Record<RenderMetricsAxisName, number>>;
  issues: string[];
  nextPrompt: string | null;
  /** Why the evaluation itself failed, when it did — distinct from a render scoring badly.
   * The backend populates it alongside `status: FAILED`. */
  evaluationError: { message: string; stage: string } | null;
};
