/** The spec field paths the backend reports, mapped to words a user recognises.
 *
 * An unmapped path falls through as-is rather than being dropped — a new spec field should read
 * as something raw, never as "nothing changed". */
const LABEL_KEY_BY_FIELD_PATH: Record<string, string> = {
  prompt: "script_project.changed_prompt.label",
  description: "script_project.changed_description.label",
  video_prompt: "script_project.changed_prompt.label",
  dialogue: "script_project.changed_dialogue.label",
  render_model: "script_project.changed_model.label",
  output_size: "script_project.changed_output_size.label",
  "settings.frame_range": "script_project.changed_duration.label",
  "settings.max_quality_retries": "script_project.changed_retries.label",
  "settings.engine": "script_project.changed_render_speed.label",
  "settings.visual_style": "script_project.changed_visual_style.label",
  "references.characters": "script_project.changed_characters.label",
  "references.environments": "script_project.changed_environments.label",
  "references.props": "script_project.changed_props.label",
  /* What `collapseReferenceChanges` produces. Without it the collapsed path fell through to the
   * raw value and the note read "you changed: references" among translated labels. */
  references: "script_project.changed_references.label"
};

export type ChangedFieldLabel = { labelKey: string | null; rawPath: string };

export const describeChangedFields = (
  changedPaths: string[] | undefined
): ChangedFieldLabel[] =>
  (changedPaths ?? []).map((rawPath) => ({
    labelKey: LABEL_KEY_BY_FIELD_PATH[rawPath] ?? null,
    rawPath
  }));

/** Anything under `references.` is one idea to a user: the images this render uses. */
export const collapseReferenceChanges = (
  changedPaths: string[] | undefined
): string[] => {
  const paths = changedPaths ?? [];
  const references = paths.filter((path) => path.startsWith("references."));
  if (references.length <= 1) return paths;

  return [
    ...paths.filter((path) => !path.startsWith("references.")),
    "references"
  ];
};
