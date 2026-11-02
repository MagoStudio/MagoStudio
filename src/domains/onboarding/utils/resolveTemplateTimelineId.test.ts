import { describe, expect, test } from "vitest";

import { resolveTemplateTimelineId } from "./resolveTemplateTimelineId";

const timelines = [
  { id: "id-car", name: "car" },
  { id: "id-golf", name: "golf" },
  { id: "id-romantic", name: "romantic" },
  { id: "id-walking", name: "walking_people" }
];

describe("resolveTemplateTimelineId", () => {
  test("resolves the timeline id matching the shot name", () => {
    expect(resolveTemplateTimelineId(timelines, "romantic")).toBe(
      "id-romantic"
    );
  });

  test("matches by name regardless of position", () => {
    const reordered = [timelines[3], timelines[0], timelines[2], timelines[1]];
    expect(resolveTemplateTimelineId(reordered, "golf")).toBe("id-golf");
  });

  test("throws when no timeline matches the shot name", () => {
    expect(() => resolveTemplateTimelineId(timelines, "missing")).toThrow(
      /missing/
    );
  });
});
