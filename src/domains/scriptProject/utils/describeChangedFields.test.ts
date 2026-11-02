import { describe, expect, it } from "vitest";

import {
  collapseReferenceChanges,
  describeChangedFields
} from "./describeChangedFields";

describe("describeChangedFields", () => {
  it("maps a spec path to the words a user recognises", () => {
    expect(describeChangedFields(["settings.frame_range"])).toEqual([
      {
        labelKey: "script_project.changed_duration.label",
        rawPath: "settings.frame_range"
      }
    ]);
  });

  it("names the render speed and visual style the way their controls do", () => {
    expect(
      describeChangedFields(["settings.engine", "settings.visual_style"])
    ).toEqual([
      {
        labelKey: "script_project.changed_render_speed.label",
        rawPath: "settings.engine"
      },
      {
        labelKey: "script_project.changed_visual_style.label",
        rawPath: "settings.visual_style"
      }
    ]);
  });

  it("keeps an unmapped path rather than dropping it", () => {
    expect(describeChangedFields(["settings.something_new"])).toEqual([
      { labelKey: null, rawPath: "settings.something_new" }
    ]);
  });

  it("is empty when nothing changed", () => {
    expect(describeChangedFields(undefined)).toEqual([]);
    expect(describeChangedFields([])).toEqual([]);
  });
});

describe("collapseReferenceChanges", () => {
  it("collapses several reference groups into one idea", () => {
    expect(
      collapseReferenceChanges([
        "video_prompt",
        "references.characters",
        "references.props"
      ])
    ).toEqual(["video_prompt", "references"]);
  });

  it("leaves a single reference group named, since it is already specific", () => {
    expect(collapseReferenceChanges(["references.characters"])).toEqual([
      "references.characters"
    ]);
  });

  it("leaves paths that are not references alone", () => {
    expect(
      collapseReferenceChanges(["video_prompt", "settings.frame_range"])
    ).toEqual(["video_prompt", "settings.frame_range"]);
  });
});

/* The two utils passed in isolation while the composition — which is what the app runs — produced
 * an unmapped path, so the note showed the user the raw word "references". */
describe("describeChangedFields composed with collapseReferenceChanges", () => {
  it("gives every collapsed path a label key", () => {
    const described = describeChangedFields(
      collapseReferenceChanges([
        "video_prompt",
        "references.characters",
        "references.props"
      ])
    );

    expect(described).toEqual([
      {
        labelKey: "script_project.changed_prompt.label",
        rawPath: "video_prompt"
      },
      {
        labelKey: "script_project.changed_references.label",
        rawPath: "references"
      }
    ]);
    expect(described.every((entry) => entry.labelKey !== null)).toBe(true);
  });

  it("still labels a single reference group specifically", () => {
    expect(
      describeChangedFields(collapseReferenceChanges(["references.characters"]))
    ).toEqual([
      {
        labelKey: "script_project.changed_characters.label",
        rawPath: "references.characters"
      }
    ]);
  });
});
