import { describe, expect, it } from "vitest";

import {
  getShotImageAssignmentStatusColor,
  getShotImageAssignmentStatusLabelKey
} from "./getShotImageAssignmentStatusDisplay";

describe("getShotImageAssignmentStatusLabelKey", () => {
  it("maps matched to the matched label key", () => {
    expect(getShotImageAssignmentStatusLabelKey("matched")).toBe(
      "plan.shot_images.status_matched.label"
    );
  });

  it("maps needs_review to the needs-review label key", () => {
    expect(getShotImageAssignmentStatusLabelKey("needs_review")).toBe(
      "plan.shot_images.status_needs_review.label"
    );
  });

  it("maps unmatched to the unmatched label key", () => {
    expect(getShotImageAssignmentStatusLabelKey("unmatched")).toBe(
      "plan.shot_images.status_unmatched.label"
    );
  });
});

describe("getShotImageAssignmentStatusColor", () => {
  it("maps matched to glyph-success", () => {
    expect(getShotImageAssignmentStatusColor("matched")).toBe("glyph-success");
  });

  it("maps needs_review to glyph-warning", () => {
    expect(getShotImageAssignmentStatusColor("needs_review")).toBe(
      "glyph-warning"
    );
  });

  it("maps unmatched to glyph-tertiary", () => {
    expect(getShotImageAssignmentStatusColor("unmatched")).toBe(
      "glyph-tertiary"
    );
  });
});
