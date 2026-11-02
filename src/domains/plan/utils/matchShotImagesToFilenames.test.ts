import { describe, expect, it } from "vitest";

import { matchShotImagesToFilenames } from "./matchShotImagesToFilenames";

describe("matchShotImagesToFilenames", () => {
  it("matches an exact shot name (no suffix)", () => {
    const { assignments } = matchShotImagesToFilenames({
      shots: [{ id: "shot-1", name: "shot_1" }],
      uploads: [{ uploadKey: "asset-1", fileName: "shot_1.jpg" }],
      manualOverrides: {}
    });

    expect(assignments).toEqual([
      {
        shotId: "shot-1",
        status: "matched",
        matchedUploadKey: "asset-1",
        candidateUploadKeys: ["asset-1"]
      }
    ]);
  });

  it("matches a shot name followed by a delimiter suffix", () => {
    const { assignments } = matchShotImagesToFilenames({
      shots: [{ id: "shot-1", name: "shot_1" }],
      uploads: [{ uploadKey: "asset-1", fileName: "shot_1_v2.jpg" }],
      manualOverrides: {}
    });

    expect(assignments[0].status).toBe("matched");
    expect(assignments[0].matchedUploadKey).toBe("asset-1");
  });

  it("does not false-positive match a numeric-suffix collision", () => {
    const { assignments } = matchShotImagesToFilenames({
      shots: [
        { id: "shot-1", name: "shot_1" },
        { id: "shot-10", name: "shot_10" }
      ],
      uploads: [{ uploadKey: "asset-10", fileName: "shot_10_v2.jpg" }],
      manualOverrides: {}
    });

    const shot1 = assignments.find((a) => a.shotId === "shot-1");
    const shot10 = assignments.find((a) => a.shotId === "shot-10");
    expect(shot1?.status).toBe("unmatched");
    expect(shot10?.status).toBe("matched");
    expect(shot10?.matchedUploadKey).toBe("asset-10");
  });

  it("flags both shots as needs_review when one upload is the sole auto-match candidate for two different shots (delimiter-prefix collision)", () => {
    const { assignments } = matchShotImagesToFilenames({
      shots: [
        { id: "shot-a", name: "shot" },
        { id: "shot-b", name: "shot_intro" }
      ],
      uploads: [{ uploadKey: "asset-1", fileName: "shot_intro_final.jpg" }],
      manualOverrides: {}
    });

    const shot = assignments.find((a) => a.shotId === "shot-a");
    const shotIntro = assignments.find((a) => a.shotId === "shot-b");
    expect(shot?.status).toBe("needs_review");
    expect(shotIntro?.status).toBe("needs_review");
    expect(shot?.matchedUploadKey).toBeUndefined();
    expect(shotIntro?.matchedUploadKey).toBeUndefined();
  });

  it("lets a manual override claim the contested asset for its shot, leaving the other shot unmatched (no remaining candidate)", () => {
    const { assignments } = matchShotImagesToFilenames({
      shots: [
        { id: "shot-a", name: "shot" },
        { id: "shot-b", name: "shot_intro" }
      ],
      uploads: [{ uploadKey: "asset-1", fileName: "shot_intro_final.jpg" }],
      manualOverrides: { "shot-b": "asset-1" }
    });

    const shot = assignments.find((a) => a.shotId === "shot-a");
    const shotIntro = assignments.find((a) => a.shotId === "shot-b");
    expect(shotIntro?.status).toBe("matched");
    expect(shotIntro?.matchedUploadKey).toBe("asset-1");
    expect(shot?.status).toBe("unmatched");
    expect(shot?.matchedUploadKey).toBeUndefined();
  });

  it("flags a shot with two candidate images as needs_review", () => {
    const { assignments } = matchShotImagesToFilenames({
      shots: [{ id: "shot-2", name: "shot_2" }],
      uploads: [
        { uploadKey: "asset-a", fileName: "shot_2_a.jpg" },
        { uploadKey: "asset-b", fileName: "shot_2_b.jpg" }
      ],
      manualOverrides: {}
    });

    expect(assignments[0].status).toBe("needs_review");
    expect(assignments[0].matchedUploadKey).toBeUndefined();
    expect(assignments[0].candidateUploadKeys).toEqual(["asset-a", "asset-b"]);
  });

  it("lets a manual override win over an unambiguous auto-match", () => {
    const { assignments } = matchShotImagesToFilenames({
      shots: [{ id: "shot-1", name: "shot_1" }],
      uploads: [
        { uploadKey: "asset-1", fileName: "shot_1.jpg" },
        { uploadKey: "asset-other", fileName: "unrelated.jpg" }
      ],
      manualOverrides: { "shot-1": "asset-other" }
    });

    expect(assignments[0]).toMatchObject({
      status: "matched",
      matchedUploadKey: "asset-other"
    });
  });

  it("lets a manual override resolve an ambiguous match", () => {
    const { assignments } = matchShotImagesToFilenames({
      shots: [{ id: "shot-2", name: "shot_2" }],
      uploads: [
        { uploadKey: "asset-a", fileName: "shot_2_a.jpg" },
        { uploadKey: "asset-b", fileName: "shot_2_b.jpg" }
      ],
      manualOverrides: { "shot-2": "asset-b" }
    });

    expect(assignments[0]).toMatchObject({
      status: "matched",
      matchedUploadKey: "asset-b"
    });
  });

  it("falls back to auto-matching when a manual override points at a removed upload", () => {
    const { assignments } = matchShotImagesToFilenames({
      shots: [{ id: "shot-1", name: "shot_1" }],
      uploads: [{ uploadKey: "asset-1", fileName: "shot_1.jpg" }],
      manualOverrides: { "shot-1": "asset-deleted" }
    });

    expect(assignments[0]).toMatchObject({
      status: "matched",
      matchedUploadKey: "asset-1"
    });
  });

  it("treats an explicit null manual override as no image", () => {
    const { assignments } = matchShotImagesToFilenames({
      shots: [{ id: "shot-1", name: "shot_1" }],
      uploads: [{ uploadKey: "asset-1", fileName: "shot_1.jpg" }],
      manualOverrides: { "shot-1": null }
    });

    expect(assignments[0].status).toBe("unmatched");
    expect(assignments[0].matchedUploadKey).toBeUndefined();
  });

  it("lists an upload matching no shot in unmatchedUploads", () => {
    const { unmatchedUploads } = matchShotImagesToFilenames({
      shots: [{ id: "shot-1", name: "shot_1" }],
      uploads: [{ uploadKey: "asset-orphan", fileName: "orphan.jpg" }],
      manualOverrides: {}
    });

    expect(unmatchedUploads).toEqual([
      { uploadKey: "asset-orphan", fileName: "orphan.jpg" }
    ]);
  });

  it("excludes a manually-assigned non-matching upload from unmatchedUploads", () => {
    const { unmatchedUploads } = matchShotImagesToFilenames({
      shots: [{ id: "shot-1", name: "shot_1" }],
      uploads: [{ uploadKey: "asset-orphan", fileName: "orphan.jpg" }],
      manualOverrides: { "shot-1": "asset-orphan" }
    });

    expect(unmatchedUploads).toEqual([]);
  });

  it("excludes an upload that is only an unresolved candidate from unmatchedUploads", () => {
    const { unmatchedUploads } = matchShotImagesToFilenames({
      shots: [{ id: "shot-2", name: "shot_2" }],
      uploads: [
        { uploadKey: "asset-a", fileName: "shot_2_a.jpg" },
        { uploadKey: "asset-b", fileName: "shot_2_b.jpg" }
      ],
      manualOverrides: {}
    });

    expect(unmatchedUploads).toEqual([]);
  });
});
