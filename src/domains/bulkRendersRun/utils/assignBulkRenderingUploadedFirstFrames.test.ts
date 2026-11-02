import { describe, expect, it } from "vitest";

import { assignBulkRenderingUploadedFirstFrames } from "./assignBulkRenderingUploadedFirstFrames";

describe("assignBulkRenderingUploadedFirstFrames", () => {
  it("assigns a matched upload's candidate key to its Shot", () => {
    const { candidateKeyByShotId } = assignBulkRenderingUploadedFirstFrames({
      shots: [{ id: "shot-1", name: "shot_1" }],
      uploadCandidates: [{ candidateKey: "asset-1", fileName: "shot_1_v2.jpg" }]
    });

    expect(candidateKeyByShotId).toEqual({ "shot-1": "asset-1" });
  });

  it("does not let a shot_10 upload false-positive match shot_1", () => {
    const { candidateKeyByShotId } = assignBulkRenderingUploadedFirstFrames({
      shots: [
        { id: "shot-1", name: "shot_1" },
        { id: "shot-10", name: "shot_10" }
      ],
      uploadCandidates: [
        { candidateKey: "asset-10", fileName: "shot_10_v2.jpg" }
      ]
    });

    expect(candidateKeyByShotId).toEqual({ "shot-10": "asset-10" });
    expect(candidateKeyByShotId).not.toHaveProperty("shot-1");
  });

  it("leaves a Shot with two candidate uploads unassigned (needs_review is treated as no image)", () => {
    const { candidateKeyByShotId } = assignBulkRenderingUploadedFirstFrames({
      shots: [{ id: "shot-2", name: "shot_2" }],
      uploadCandidates: [
        { candidateKey: "asset-a", fileName: "shot_2_a.jpg" },
        { candidateKey: "asset-b", fileName: "shot_2_b.jpg" }
      ]
    });

    expect(candidateKeyByShotId).toEqual({});
  });

  it("assigns every matched Shot independently in a multi-Shot upload", () => {
    const { candidateKeyByShotId } = assignBulkRenderingUploadedFirstFrames({
      shots: [
        { id: "shot-1", name: "shot_1" },
        { id: "shot-2", name: "shot_2" }
      ],
      uploadCandidates: [
        { candidateKey: "asset-1", fileName: "shot_1.jpg" },
        { candidateKey: "asset-2", fileName: "shot_2.jpg" }
      ]
    });

    expect(candidateKeyByShotId).toEqual({
      "shot-1": "asset-1",
      "shot-2": "asset-2"
    });
  });

  it("leaves an upload matching no Shot unassigned", () => {
    const { candidateKeyByShotId } = assignBulkRenderingUploadedFirstFrames({
      shots: [{ id: "shot-1", name: "shot_1" }],
      uploadCandidates: [
        { candidateKey: "asset-orphan", fileName: "orphan.jpg" }
      ]
    });

    expect(candidateKeyByShotId).toEqual({});
  });

  it("does not pass a manual override through, since Bulk never offers one", () => {
    const { candidateKeyByShotId } = assignBulkRenderingUploadedFirstFrames({
      shots: [
        { id: "shot-a", name: "shot" },
        { id: "shot-b", name: "shot_intro" }
      ],
      uploadCandidates: [
        { candidateKey: "asset-1", fileName: "shot_intro_final.jpg" }
      ]
    });

    expect(candidateKeyByShotId).toEqual({});
  });
});
