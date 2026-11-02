import { describe, expect, it } from "vitest";

import { getSelectedShotImageAssignments } from "./getSelectedShotImageAssignments";

describe("getSelectedShotImageAssignments", () => {
  it("only matches against shots included in timelineIds", () => {
    const result = getSelectedShotImageAssignments({
      shots: [
        { id: "shot-1", name: "shot_1" },
        { id: "shot-2", name: "shot_2" }
      ],
      timelineIds: ["shot-1"],
      uploads: [
        { status: "done", assetId: "asset-1", fileName: "shot_1.jpg" },
        { status: "done", assetId: "asset-2", fileName: "shot_2.jpg" }
      ],
      manualOverrides: {}
    });

    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0]).toMatchObject({
      shotId: "shot-1",
      status: "matched",
      matchedUploadKey: "asset-1"
    });
  });

  it("excludes uploading/error uploads from doneUploads and matching", () => {
    const result = getSelectedShotImageAssignments({
      shots: [{ id: "shot-1", name: "shot_1" }],
      timelineIds: ["shot-1"],
      uploads: [
        { status: "uploading", fileName: "shot_1_v2.jpg" },
        { status: "error", fileName: "shot_1_v3.jpg" }
      ],
      manualOverrides: {}
    });

    expect(result.doneUploads).toEqual([]);
    expect(result.assignments[0].status).toBe("unmatched");
  });

  it("reports hasPendingUploads when any upload is still uploading", () => {
    const result = getSelectedShotImageAssignments({
      shots: [],
      timelineIds: [],
      uploads: [{ status: "uploading", fileName: "shot_1.jpg" }],
      manualOverrides: {}
    });

    expect(result.hasPendingUploads).toBe(true);
  });

  it("reports hasPendingUploads as false when no upload is in progress", () => {
    const result = getSelectedShotImageAssignments({
      shots: [],
      timelineIds: [],
      uploads: [
        { status: "done", assetId: "asset-1", fileName: "shot_1.jpg" },
        { status: "error", fileName: "shot_2.jpg" }
      ],
      manualOverrides: {}
    });

    expect(result.hasPendingUploads).toBe(false);
  });
});
