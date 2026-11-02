import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("lets a numeric z-index utility override a named z-index token", () => {
    expect(cn("z-menu overflow-auto m-0 mt-1 px-0 py-1", "z-10")).toBe(
      "overflow-auto m-0 mt-1 px-0 py-1 z-10"
    );
  });

  it("lets a named z-index token override a numeric z-index utility", () => {
    expect(cn("z-10", "z-modal")).toBe("z-modal");
  });

  it("lets the later of two named z-index tokens win", () => {
    expect(cn("z-modal", "z-toast")).toBe("z-toast");
    expect(cn("z-toast", "z-modal")).toBe("z-modal");
  });
});
