import { describe, expect, test } from "vitest";

import { getRenderEta } from "./renderEta";

describe("getRenderEta", () => {
  const startedAt = new Date("2026-08-07T12:00:00.000Z");

  test("uses the backend video estimate and computes progress", () => {
    expect(
      getRenderEta({
        model: "happy_horse_1",
        status: "INPROGRESS",
        startedAt,
        now: new Date("2026-08-07T12:02:00.000Z")
      })
    ).toEqual({
      ETA: 360,
      estimatedEndTime: "2026-08-07T12:08:00.000Z",
      progress: 25
    });
  });

  test("uses the image model estimates", () => {
    expect(
      getRenderEta({
        model: "gpt_image_2",
        status: "INPROGRESS",
        startedAt,
        now: new Date("2026-08-07T12:00:05.000Z")
      })
    ).toMatchObject({ ETA: 10 });
    expect(
      getRenderEta({
        model: "seedream_5_pro",
        status: "INPROGRESS",
        startedAt,
        now: new Date("2026-08-07T12:00:05.000Z")
      })
    ).toMatchObject({ ETA: 5 });
    expect(
      getRenderEta({
        model: "qwen",
        status: "INPROGRESS",
        startedAt,
        now: new Date("2026-08-07T12:01:00.000Z")
      })
    ).toMatchObject({ ETA: 60, progress: 50 });
  });

  test("clamps overdue renders without marking them complete", () => {
    expect(
      getRenderEta({
        model: "seedance_2",
        status: "INPROGRESS",
        startedAt,
        now: new Date("2026-08-07T12:10:00.000Z")
      })
    ).toMatchObject({ ETA: 0, progress: 99 });
  });

  test("does not expose an ETA before provider processing starts", () => {
    expect(
      getRenderEta({
        model: "happy_horse_1",
        status: "INQUEUE",
        startedAt
      })
    ).toEqual({});
  });
});
