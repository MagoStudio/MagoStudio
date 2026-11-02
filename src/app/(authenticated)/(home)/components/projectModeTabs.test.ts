import { describe, expect, it } from "vitest";

import { getProjectModeTabs } from "./projectModeTabs";

const t = ((key: string) => key) as Parameters<
  typeof getProjectModeTabs
>[0]["t"];

describe("getProjectModeTabs", () => {
  it("only includes modes available in the local app", () => {
    const tabs = getProjectModeTabs({ t });
    const ids = tabs.map((tab) => tab.id);

    expect(ids).toEqual([
      "render-video",
      "edit-frame",
      "upscale",
      "global-timeline"
    ]);
  });

  it("omits the plan tab for non-team members", () => {
    const tabs = getProjectModeTabs({ t });
    expect(tabs.some((tab) => tab.id === "plan")).toBe(false);
  });

  it("appends the plan tab for team members", () => {
    const tabs = getProjectModeTabs({
      t,
      isTeamMember: true,
      isPlanAvailable: true
    });
    const ids = tabs.map((tab) => tab.id);

    expect(ids).toEqual([
      "render-video",
      "edit-frame",
      "upscale",
      "global-timeline",
      "plan"
    ]);
  });

  it("hides the plan tab where nothing implements it, team member or not", () => {
    // The desktop app: every plan call goes to the cloud backend and the
    // bridge has no arm for it, so showing the tab only offers a dead page.
    const tabs = getProjectModeTabs({
      t,
      isTeamMember: true,
      isPlanAvailable: false
    });

    expect(tabs.some((tab) => tab.id === "plan")).toBe(false);
  });

  it("disables the edit-frame tab when isEditFrameAvailable is false", () => {
    const tabs = getProjectModeTabs({ t, isEditFrameAvailable: false });
    const editFrameTab = tabs.find((tab) => tab.id === "edit-frame");

    expect(editFrameTab).toMatchObject({ isDisabled: true });
  });

  it("disables the upscale tab when no input video is available", () => {
    const tabs = getProjectModeTabs({ t, isEditFrameAvailable: false });
    const upscaleTab = tabs.find((tab) => tab.id === "upscale");

    expect(upscaleTab).toMatchObject({ isDisabled: true });
  });
});
