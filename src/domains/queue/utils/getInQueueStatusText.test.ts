import { describe, expect, it } from "vitest";

import { getInQueueStatusText } from "./getInQueueStatusText";

describe("getInQueueStatusText", () => {
  it("returns an empty string for undefined or head-of-queue positions", () => {
    expect(getInQueueStatusText(undefined)).toBe("");
    expect(getInQueueStatusText(0)).toBe("");
  });

  it("renders 1-based ordinal positions", () => {
    expect(getInQueueStatusText(1)).toBe("In Queue: 2nd");
    expect(getInQueueStatusText(2)).toBe("In Queue: 3rd");
    expect(getInQueueStatusText(3)).toBe("In Queue: 4th");
  });

  it("uses 'th' for the 11th–13th special cases", () => {
    expect(getInQueueStatusText(10)).toBe("In Queue: 11th");
    expect(getInQueueStatusText(11)).toBe("In Queue: 12th");
    expect(getInQueueStatusText(12)).toBe("In Queue: 13th");
  });

  it("resumes st/nd/rd suffixes past the teens", () => {
    expect(getInQueueStatusText(20)).toBe("In Queue: 21st");
    expect(getInQueueStatusText(21)).toBe("In Queue: 22nd");
    expect(getInQueueStatusText(22)).toBe("In Queue: 23rd");
  });
});
