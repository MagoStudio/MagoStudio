import { describe, expect, it } from "vitest";

import { validateBulkRenderingShotSuppliedFirstFrame } from "./validateBulkRenderingShotSuppliedFirstFrame";

describe("validateBulkRenderingShotSuppliedFirstFrame", () => {
  it("blocks a supplied-frames Shot with no uploaded image", () => {
    const errors = validateBulkRenderingShotSuppliedFirstFrame({
      firstFrameSource: "uploaded",
      hasUploadedFirstFrame: false
    });

    expect(errors).toEqual([
      {
        key: "firstFrame",
        message:
          "bulk_rendering.draft_shot_missing_uploaded_first_frame_error.label"
      }
    ]);
  });

  it("passes a supplied-frames Shot that has an uploaded image", () => {
    const errors = validateBulkRenderingShotSuppliedFirstFrame({
      firstFrameSource: "uploaded",
      hasUploadedFirstFrame: true
    });

    expect(errors).toEqual([]);
  });

  it("never blocks a generated-frames Shot, whether or not it has an uploaded image", () => {
    expect(
      validateBulkRenderingShotSuppliedFirstFrame({
        firstFrameSource: "generated",
        hasUploadedFirstFrame: false
      })
    ).toEqual([]);
    expect(
      validateBulkRenderingShotSuppliedFirstFrame({
        firstFrameSource: "generated",
        hasUploadedFirstFrame: true
      })
    ).toEqual([]);
  });
});
