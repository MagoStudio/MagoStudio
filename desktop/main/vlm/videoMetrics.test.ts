import { describe, expect, it } from "vitest";

import {
  IMAGE_TO_VIDEO_METRICS_INSTRUCTION,
  VIDEO_METRICS_PROMPT
} from "./prompts/videoMetrics.generated";
import {
  buildVideoMetricsPrompt,
  parseVideoMetrics,
  sampleMetricsTimestamps
} from "./videoMetrics";

const response = {
  vid_score: 8,
  vid_pass: false,
  vid_style: 8,
  vid_content: 7,
  vid_identity: 6,
  vid_lighting: 8,
  vid_quality: 8,
  vid_temporal_style: 9,
  vid_temporal_identity: 5,
  vid_issues: ["Identity drift"],
  vid_per_frame_notes: [],
  vid_next_prompt: "Keep the red coat and facial structure constant."
};

describe("backend video judge contract", () => {
  it("keeps evaluator pass/fail independent from the numeric score and clamps axes", () => {
    const parsed = parseVideoMetrics(
      JSON.stringify({ ...response, vid_style: 12, vid_quality: -1 })
    );
    expect(parsed).toMatchObject({
      vid_score: 8,
      vid_pass: false,
      vid_style: 10,
      vid_quality: 0
    });
    expect(parsed.warnings).toHaveLength(2);
  });
  it("rejects missing scores rather than inventing an evaluation", () => {
    expect(() => parseVideoMetrics('{"vid_score":8}')).toThrow();
  });
  it("preserves backend consistency warnings", () => {
    expect(
      parseVideoMetrics(
        JSON.stringify({ ...response, vid_pass: true, vid_next_prompt: "" })
      ).warnings
    ).toHaveLength(2);
  });
  it("matches the backend sampling rules, including ties-to-even", () => {
    expect(sampleMetricsTimestamps(2)).toEqual([0, 1, 2]);
    expect(sampleMetricsTimestamps(5)).toEqual([0, 1.25, 2.5, 3.75, 5]);
    expect(sampleMetricsTimestamps(4.5)).toHaveLength(4);
    expect(sampleMetricsTimestamps(5.5)).toHaveLength(6);
    expect(sampleMetricsTimestamps(15)).toHaveLength(8);
    expect(() => sampleMetricsTimestamps(NaN)).toThrow();
  });
  it("uses the verbatim backend instructions and labels every montage frame", () => {
    const prompt = buildVideoMetricsPrompt(
      "A cat walks",
      sampleMetricsTimestamps(5),
      true
    );
    expect(prompt).toContain(VIDEO_METRICS_PROMPT);
    expect(prompt).toContain(IMAGE_TO_VIDEO_METRICS_INSTRUCTION);
    expect(prompt).toContain("Image 1 is a grid of reference assets");
    expect(prompt).toContain("Image 3 is a 2x2 grid");
    expect(prompt).toContain("frame 5/5 (t=5.00s)");
    expect(prompt).toContain('Prompt that was used: "A cat walks"');
  });
});
