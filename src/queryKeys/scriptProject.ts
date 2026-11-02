/** A dry run's answer depends on the output size and the render settings its request carries, so
 * those travel in the key. Without them one cached entry served every parameter set, and the
 * counts kept describing the shot duration or resolution the user had already changed. */
export const projectState = {
  all: ["projectState"] as const,
  byProjectId: (projectId: string | null | undefined) =>
    [...projectState.all, projectId] as const,
  sheetsDryRun: (
    projectId: string | null | undefined,
    outputSize?: [number, number],
    settings?: Record<string, unknown>
  ) =>
    [
      ...projectState.byProjectId(projectId),
      "sheetsDryRun",
      { outputSize, settings }
    ] as const,
  shotsDryRun: (
    projectId: string | null | undefined,
    outputSize?: [number, number],
    videoSettings?: Record<string, unknown>,
    sequential?: Record<string, unknown>
  ) =>
    [
      ...projectState.byProjectId(projectId),
      "shotsDryRun",
      { outputSize, videoSettings, sequential }
    ] as const,
  upscaleDryRun: (projectId: string | null | undefined) =>
    [...projectState.byProjectId(projectId), "upscaleDryRun"] as const,
  sceneStoryboard: (
    projectId: string | null | undefined,
    sceneTimelineId: string | null | undefined
  ) =>
    [
      ...projectState.byProjectId(projectId),
      "sceneStoryboard",
      sceneTimelineId
    ] as const
};

export const sheetImageInputs = {
  all: ["sheetImageInputs"] as const,
  /** Its own key, not the Img2Img status key. Both hit the same endpoint but parse different
   * shapes, and both hold their result forever, so whichever fetched first decided what the
   * other one saw. */
  byClipId: (clipId: string | null | undefined) =>
    [...sheetImageInputs.all, clipId] as const
};

export const projectScriptVersions = {
  all: ["projectScriptVersions"] as const,
  byProjectId: (projectId: string | null | undefined) =>
    [...projectScriptVersions.all, projectId] as const
};

export const projectCut = {
  all: ["projectCut"] as const,
  byProjectId: (projectId: string | null | undefined) =>
    [...projectCut.all, projectId] as const,
  /** Nested under the cut's key, so re-pinning a shot refreshes both. */
  exportDryRun: (projectId: string | null | undefined) =>
    [...projectCut.byProjectId(projectId), "exportDryRun"] as const
};

export const scriptChatMessages = {
  all: ["scriptChatMessages"] as const,
  byProjectId: (projectId: string | null | undefined) =>
    [...scriptChatMessages.all, projectId] as const
};
