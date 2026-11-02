import { renderHook } from "@testing-library/react";
import { useAtomValue } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@domains/project/useSelectedProjectId", () => ({
  useSelectedProjectId: () => "project-1"
}));
vi.mock("@domains/shot/useSelectedShotId", () => ({
  useSelectedShotId: () => ({ selectedShotId: "shot-1" })
}));
vi.mock("@platform/identity", () => ({
  useUser: () => ({ user: { id: "user-1" } })
}));

import { useInputTrackIdAtom } from "./inputTrackIdAtom.local";

describe("useInputTrackIdAtom (desktop)", () => {
  beforeEach(() => localStorage.clear());

  it("returns the saved input Track on the first render, before the atom mounts", () => {
    localStorage.setItem(
      "input-track-id-user-1-project-1-shot-1",
      JSON.stringify("track-1")
    );

    const renderedValues: (string | undefined)[] = [];
    renderHook(() => {
      renderedValues.push(useAtomValue(useInputTrackIdAtom()));
    });

    expect(renderedValues[0]).toBe("track-1");
  });
});
