import { describe, expect, it } from "vitest";

import { buildAppSectionCopyText } from "./buildAppSectionCopyText";
import { VERSION_ROW_LABEL_KEY } from "./debugInfoAppConstants";

const t = (key: string) => key;

describe("Debug modal app section", () => {
  it("does not emit a Mask field in the copied App section text", () => {
    const text = buildAppSectionCopyText(t, "1.2.3");

    expect(text).not.toMatch(/^\s*Mask:/m);
  });

  it("emits the app version under the version row label", () => {
    const text = buildAppSectionCopyText(t, "1.2.3");

    expect(text).toContain(`${VERSION_ROW_LABEL_KEY}: 1.2.3`);
  });
});
