import { describe, expect, it } from "vitest";

import {
  insertManualShot,
  placeShot,
  sequentialPredecessors
} from "./shotOrder";

type JsonRecord = Record<string, unknown>;

const shot = (index: number, overrides: JsonRecord = {}): JsonRecord => ({
  timeline_id: `shot-${index}`,
  shot_index: index - 1,
  sequence_id: index,
  key: String(index),
  edited: false,
  ...overrides
});

const threeShots = () => [shot(1), shot(2), shot(3)];
const order = (shots: JsonRecord[]) =>
  shots.map((candidate) => candidate.timeline_id);
const byId = (shots: JsonRecord[], timelineId: string) =>
  shots.find((candidate) => candidate.timeline_id === timelineId)!;

describe("insertManualShot", () => {
  it("appends a shot with no position", () => {
    const shots = threeShots();
    const { shot: added, order: entries } = insertManualShot({
      shots,
      fields: { video_prompt: "A new beat." },
      shotIndex: null,
      scriptVersion: 1
    });
    expect(added.shot_index).toBe(3);
    expect(entries.map((entry) => entry.shot_index)).toEqual([0, 1, 2, 3]);
  });

  it("shifts the later shots when added at a position", () => {
    const shots = threeShots();
    const { shot: added } = insertManualShot({
      shots,
      fields: {},
      shotIndex: 1,
      scriptVersion: 1
    });
    expect(order(shots)).toEqual([
      "shot-1",
      added.timeline_id,
      "shot-2",
      "shot-3"
    ]);
    expect(shots.map((candidate) => candidate.shot_index)).toEqual([
      0, 1, 2, 3
    ]);
  });

  it("clamps a position past the end", () => {
    const shots = threeShots();
    const { shot: added } = insertManualShot({
      shots,
      fields: {},
      shotIndex: 99,
      scriptVersion: 1
    });
    expect(added.shot_index).toBe(3);
  });

  it("stores a manual shot with no sequence, a distinct key and its fields", () => {
    const shots = threeShots();
    const first = insertManualShot({
      shots,
      fields: {
        heading: "  Kitchen  ",
        video_prompt: "Maya opens the fridge.",
        tags: { characters: ["maya"] }
      },
      shotIndex: null,
      scriptVersion: 2
    }).shot;
    const second = insertManualShot({
      shots,
      fields: {},
      shotIndex: null,
      scriptVersion: 2
    }).shot;
    expect(first).toMatchObject({
      sequence_id: null,
      manual: true,
      heading: "Kitchen",
      video_prompt: "Maya opens the fridge.",
      tags: { characters: ["maya"], environments: [], props: [] },
      script_version: 2
    });
    expect(String(first.key)).toMatch(/^manual-[0-9a-f]{12}$/u);
    expect(first.key).not.toBe(second.key);
    expect(second.heading).toBeNull();
  });

  it("flags a sequential shot that a new shot now precedes", () => {
    const shots = [shot(1), shot(2, { sequential: { enabled: true } })];
    insertManualShot({ shots, fields: {}, shotIndex: 1, scriptVersion: 1 });
    expect(byId(shots, "shot-2")).toMatchObject({
      edited: true,
      edited_fields: ["predecessor"]
    });
  });
});

describe("placeShot", () => {
  it("moves a shot up and shifts the ones it passes", () => {
    const shots = threeShots();
    placeShot({
      shots,
      shot: byId(shots, "shot-3"),
      shotIndex: 0,
      isShotHidden: null
    });
    expect(order(shots)).toEqual(["shot-3", "shot-1", "shot-2"]);
    expect(shots.map((candidate) => candidate.shot_index)).toEqual([0, 1, 2]);
  });

  it("does not mark a non-sequential shot as edited when it moves", () => {
    const shots = threeShots();
    placeShot({
      shots,
      shot: byId(shots, "shot-3"),
      shotIndex: 0,
      isShotHidden: null
    });
    expect(shots.every((candidate) => candidate.edited === false)).toBe(true);
  });

  it("flags a moved sequential shot and clears the flag when it moves back", () => {
    const shots = [
      shot(1),
      shot(2),
      shot(3, { sequential: { enabled: true } })
    ];
    placeShot({
      shots,
      shot: byId(shots, "shot-3"),
      shotIndex: 1,
      isShotHidden: null
    });
    expect(byId(shots, "shot-3")).toMatchObject({
      edited: true,
      edited_fields: ["predecessor"]
    });

    placeShot({
      shots,
      shot: byId(shots, "shot-3"),
      shotIndex: 2,
      isShotHidden: null
    });
    expect(byId(shots, "shot-3")).toMatchObject({
      edited: false,
      edited_fields: []
    });
    expect(byId(shots, "shot-3")).not.toHaveProperty("predecessor_baseline");
  });

  it("keeps an earlier edit when a flagged shot moves back", () => {
    const shots = [
      shot(1),
      shot(2),
      shot(3, {
        sequential: { enabled: true },
        edited: true,
        edited_fields: ["video_prompt"]
      })
    ];
    placeShot({
      shots,
      shot: byId(shots, "shot-3"),
      shotIndex: 1,
      isShotHidden: null
    });
    placeShot({
      shots,
      shot: byId(shots, "shot-3"),
      shotIndex: 2,
      isShotHidden: null
    });
    expect(byId(shots, "shot-3")).toMatchObject({
      edited: true,
      edited_fields: ["video_prompt"]
    });
  });

  it("flags the next sequential shot when one is hidden, and unhiding clears it", () => {
    const shots = [
      shot(1),
      shot(2),
      shot(3, { sequential: { enabled: true } })
    ];
    placeShot({
      shots,
      shot: byId(shots, "shot-2"),
      shotIndex: null,
      isShotHidden: true
    });
    expect(byId(shots, "shot-2").hidden).toBe(true);
    expect(byId(shots, "shot-3").edited).toBe(true);

    placeShot({
      shots,
      shot: byId(shots, "shot-2"),
      shotIndex: null,
      isShotHidden: false
    });
    expect(byId(shots, "shot-2")).not.toHaveProperty("hidden");
    expect(byId(shots, "shot-3").edited).toBe(false);
  });

  it("does not flag a hidden sequential shot itself", () => {
    const shots = [shot(1), shot(2, { sequential: { enabled: true } })];
    placeShot({
      shots,
      shot: byId(shots, "shot-2"),
      shotIndex: null,
      isShotHidden: true
    });
    expect(byId(shots, "shot-2").edited).toBe(false);
  });
});

describe("sequentialPredecessors", () => {
  it("skips dropped and hidden shots but still answers for them", () => {
    const predecessors = sequentialPredecessors([
      shot(1),
      shot(2, { dropped: true }),
      shot(3, { hidden: true }),
      shot(4)
    ]);
    expect(Object.fromEntries(predecessors)).toEqual({
      "shot-1": null,
      "shot-2": "shot-1",
      "shot-3": "shot-1",
      "shot-4": "shot-1"
    });
  });
});
