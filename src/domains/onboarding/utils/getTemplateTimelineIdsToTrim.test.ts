import { describe, expect, test } from "vitest";

import { getTemplateTimelineIdsToTrim } from "./getTemplateTimelineIdsToTrim";

const timelines = [
  { id: "id-car", name: "car" },
  { id: "id-golf", name: "golf" },
  { id: "id-romantic", name: "romantic" },
  { id: "id-walking", name: "walking_people" }
];

describe("getTemplateTimelineIdsToTrim", () => {
  test("returns the non-selected ids from a 4-shot list", () => {
    expect(getTemplateTimelineIdsToTrim(timelines, "id-romantic")).toEqual([
      "id-car",
      "id-golf",
      "id-walking"
    ]);
  });

  test("returns an empty array when only the selected shot exists", () => {
    const single = [{ id: "id-car", name: "car" }];
    expect(getTemplateTimelineIdsToTrim(single, "id-car")).toEqual([]);
  });

  test("excludes exactly the selected id regardless of order", () => {
    const reordered = [timelines[3], timelines[0], timelines[2], timelines[1]];
    expect(getTemplateTimelineIdsToTrim(reordered, "id-golf")).toEqual([
      "id-walking",
      "id-car",
      "id-romantic"
    ]);
  });
});
