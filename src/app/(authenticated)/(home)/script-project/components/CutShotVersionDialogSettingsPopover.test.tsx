import { orderCutShotVersionsForDisplay } from "@domains/scriptProject/utils/orderCutShotVersionsForDisplay";
import { CutShotVersion, ProjectCutSchema } from "@schemas/scriptProject";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { CutShotVersionDialog } from "./CutShotVersionDialog";

vi.mock("@domains/asset/useCachedVideoPreview", () => ({
  useCachedVideoPreview: () => ({
    videoFirstFrameUrl: undefined,
    playableVideoUrl: undefined
  })
}));

vi.mock("./RenderMetricsBadge", () => ({ RenderMetricsBadge: () => null }));

const SENT_PROMPT = "The hero walks in. Stage this shot as panel 1.";
const VIDEO_PROMPT = "The hero walks in.";

const shot = ProjectCutSchema.parse({
  project_id: "project",
  shots: [
    {
      timeline_id: "scene",
      shot_index: 0,
      sequence_id: 1,
      versions: [
        {
          layer_id: "layer",
          asset_id: "with-prompt",
          created_at: "2026-10-02T12:00:00Z",
          ready: true,
          status: "finished",
          sent_prompt: SENT_PROMPT,
          render_spec: {
            kind: "shot",
            video_prompt: VIDEO_PROMPT,
            settings: { frame_range: [0, 100] }
          }
        },
        {
          layer_id: "layer",
          asset_id: "without-prompt",
          created_at: "2026-10-01T12:00:00Z",
          ready: true,
          status: "finished"
        }
      ]
    }
  ]
}).shots[0]!;

const renderDialog = ({
  onOpenChange = vi.fn(),
  onPin = vi.fn(),
  onReuseSettings = vi.fn()
}: {
  onOpenChange?: (isOpen: boolean) => void;
  onPin?: (assetId: string | null) => void;
  onReuseSettings?: (version: CutShotVersion) => void;
} = {}) =>
  renderWithProviders(
    <CutShotVersionDialog
      projectId="project"
      shot={shot}
      outputSize={[1024, 576]}
      versionsInDisplayOrder={orderCutShotVersionsForDisplay(shot, new Map())}
      shownVersionAssetId="with-prompt"
      isOpen
      isBusy={false}
      onOpenChange={onOpenChange}
      onPin={onPin}
      onReuseSettings={onReuseSettings}
    />
  );

describe("CutShotVersionDialog settings popover", () => {
  it("shows the settings the user chose, never the prompt sent to the model", async () => {
    const user = userEvent.setup();
    const screen = renderDialog();

    await user.click(
      screen.getByTestId("cut-version-settings-button-with-prompt")
    );

    expect(
      await screen.findByTestId("cut-version-settings-with-prompt")
    ).toHaveTextContent(VIDEO_PROMPT);
    expect(screen.queryByText(SENT_PROMPT)).toBeNull();
  });

  it("rounds the version's duration to a tenth of a second", async () => {
    const user = userEvent.setup();
    const screen = renderDialog();

    await user.click(
      screen.getByTestId("cut-version-settings-button-with-prompt")
    );

    expect(await screen.findByText("4.2s")).toBeVisible();
  });

  it("reuses the version's settings from inside the popover", async () => {
    const user = userEvent.setup();
    const onReuseSettings = vi.fn();
    const screen = renderDialog({ onReuseSettings });

    await user.click(
      screen.getByTestId("cut-version-settings-button-with-prompt")
    );
    await user.click(
      await screen.findByTestId("cut-version-reuse-with-prompt")
    );

    expect(onReuseSettings).toHaveBeenCalledWith(
      expect.objectContaining({ asset_id: "with-prompt" })
    );
  });

  it("offers no reuse for a version that recorded no settings", async () => {
    const user = userEvent.setup();
    const screen = renderDialog();

    await user.click(
      screen.getByTestId("cut-version-settings-button-without-prompt")
    );

    expect(
      await screen.findByTestId("cut-version-settings-without-prompt")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("cut-version-reuse-without-prompt")).toBeNull();
  });

  it("stays open when a version is picked, so the versions keep their places", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onPin = vi.fn();
    const screen = renderDialog({ onOpenChange, onPin });

    await user.click(screen.getByTestId("cut-version-use-without-prompt"));

    expect(onPin).toHaveBeenCalledWith("without-prompt");
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
