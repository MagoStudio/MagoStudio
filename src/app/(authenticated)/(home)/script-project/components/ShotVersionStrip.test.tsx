import { orderCutShotVersionsForDisplay } from "@domains/scriptProject/utils/orderCutShotVersionsForDisplay";
import { CutShot, ProjectCutSchema } from "@schemas/scriptProject";
import { fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { ShotVersionStrip } from "./ShotVersionStrip";

vi.mock("@domains/project/useProject", () => ({
  useProject: () => ({
    data: {
      timelines: [
        {
          layers: [
            { id: "layer", created_at: new Date("2026-10-01T12:00:00Z") }
          ]
        }
      ]
    }
  })
}));
vi.mock("./ShotVideoPreview", () => ({
  ShotVideoPreview: ({
    onPlay,
    overlay
  }: {
    onPlay?: () => void;
    overlay?: React.ReactNode;
  }) => (
    <div>
      <button onClick={onPlay}>Play preview</button>
      {overlay}
    </div>
  )
}));
beforeEach(() => window.localStorage.clear());
const shot = ProjectCutSchema.parse({
  project_id: "project",
  shots: [
    {
      timeline_id: "shot",
      shot_index: 0,
      sequence_id: 1,
      versions: [
        {
          layer_id: "layer",
          asset_id: "shown",
          created_at: "2026-10-02T12:00:00Z",
          ready: true,
          status: "finished"
        },
        {
          layer_id: "layer",
          asset_id: "take",
          created_at: "2026-10-01T12:00:00Z",
          ready: true,
          status: "finished",
          render_spec: { video_prompt: "Prompt" }
        }
      ]
    }
  ]
}).shots[0]!;

const withVersionsInDisplayOrder = (shot: CutShot) => ({
  shot,
  versionsInDisplayOrder: orderCutShotVersionsForDisplay(shot, new Map())
});

describe("inline version review", () => {
  it("marks played versions viewed and keeps the name and date in the more menu", async () => {
    const props = {
      projectId: "project",
      ...withVersionsInDisplayOrder(shot),
      outputSize: [1024, 576] as [number, number],
      isBusy: false,
      onPin: vi.fn(),
      onReuseSettings: vi.fn()
    };
    const screen = renderWithProviders(<ShotVersionStrip {...props} />);
    expect(
      screen.getByTestId("shot-card-version-new-take")
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Rendered /)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Play preview" }));
    expect(screen.queryByTestId("shot-card-version-new-take")).toBeNull();
    fireEvent.click(screen.getByTestId("shot-card-version-more-take"));
    expect(
      await screen.findByTestId("shot-card-version-more-take-details")
    ).toHaveTextContent("Rendered");
    screen.unmount();
    const restored = renderWithProviders(<ShotVersionStrip {...props} />);
    expect(restored.queryByTestId("shot-card-version-new-take")).toBeNull();
  });
  it("leaves the shown version out, pins another and passes provenance to the reuse action", async () => {
    const onPin = vi.fn(),
      onReuseSettings = vi.fn();
    const screen = renderWithProviders(
      <ShotVersionStrip
        projectId="project"
        {...withVersionsInDisplayOrder({ ...shot, pinned_asset_id: "shown" })}
        outputSize={[1024, 576]}
        isBusy={false}
        onPin={onPin}
        onReuseSettings={onReuseSettings}
      />
    );
    expect(screen.queryByTestId("shot-card-version-shown")).toBeNull();
    fireEvent.click(screen.getByTestId("shot-card-version-pin-take"));
    expect(onPin).toHaveBeenCalledWith("take");
    expect(screen.getByTestId("shot-card-version-pin-take")).toHaveTextContent(
      "Pin"
    );
    fireEvent.click(screen.getByTestId("shot-card-version-more-take"));
    fireEvent.click(
      await screen.findByTestId("shot-card-version-more-take-reuse")
    );
    expect(onReuseSettings).toHaveBeenCalledWith(shot.versions[1]);
  });
});
