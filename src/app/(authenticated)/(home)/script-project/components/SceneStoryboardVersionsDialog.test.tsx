import { SceneStoryboardResponseSchema } from "@schemas/scriptProject";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { SceneStoryboardVersionsDialog } from "./SceneStoryboardVersionsDialog";

const sceneStoryboard = SceneStoryboardResponseSchema.parse({
  timeline_id: "scene",
  storyboard: {
    status: "ready",
    selected_asset_id: "pinned",
    effective_asset_id: "pinned",
    version_count: 3,
    versions: [
      {
        asset_id: "newest-failed",
        status: "failed",
        url: null
      },
      {
        asset_id: "pinned",
        status: "success",
        url: "https://cdn.example/pinned.png"
      },
      {
        asset_id: "older",
        status: "success",
        url: "https://cdn.example/older.png"
      }
    ]
  }
}).storyboard;

vi.mock("@domains/scriptProject/useSceneStoryboard", () => ({
  useSceneStoryboard: () => ({ data: sceneStoryboard })
}));

const setup = () => {
  const onPin = vi.fn();
  const screen = renderWithProviders(
    <SceneStoryboardVersionsDialog
      projectId="project"
      sceneTimelineId="scene"
      sceneTitle="1 Opening"
      isOpen
      isBusy={false}
      onOpenChange={vi.fn()}
      onPin={onPin}
    />
  );
  return { ...screen, onPin };
};

describe("SceneStoryboardVersionsDialog", () => {
  it("pins a finished version and unpins the pinned one", () => {
    const screen = setup();

    fireEvent.click(screen.getByTestId("storyboard-version-use-older"));
    expect(screen.onPin).toHaveBeenCalledWith("older");

    fireEvent.click(screen.getByTestId("storyboard-version-unpin-pinned"));
    expect(screen.onPin).toHaveBeenCalledWith(null);
  });

  it("does not let a failed version be pinned", () => {
    const screen = setup();
    expect(
      screen.getByTestId("storyboard-version-use-newest-failed")
    ).toBeDisabled();
    expect(screen.getByText("This version failed")).toBeTruthy();
  });
});
