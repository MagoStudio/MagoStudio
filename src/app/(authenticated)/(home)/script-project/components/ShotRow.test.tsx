import { buildStoryboardSheetToken } from "@domains/scriptProject/utils/buildStoryboardSheetToken";
import { describeSceneStoryboardFromBackend } from "@domains/scriptProject/utils/describeSceneStoryboardFromBackend";
import { describeSceneStoryboardFromSheets } from "@domains/scriptProject/utils/describeSceneStoryboardFromSheets";
import { ShotStoryboard } from "@domains/scriptProject/utils/findShotStoryboard";
import { SceneStoryboardView } from "@domains/scriptProject/utils/sceneStoryboardView";
import {
  CutShot,
  ProjectCutSchema,
  ProjectStateSchema
} from "@schemas/scriptProject";
import { fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { ScriptProjectRenderCost } from "./RenderCostLabel";
import { ShotRow } from "./ShotRow";
import { ScenesView } from "./utils/scenesView";

vi.mock("./CutShotVersionPreview", () => ({
  CutShotVersionPreview: () => null
}));
vi.mock("./ShotVersionStrip", () => ({
  ShotVersionStrip: () => <div data-testid="version-strip" />
}));
beforeEach(() => window.localStorage.clear());
vi.mock("./ShotVideoPreview", () => ({ ShotVideoPreview: () => null }));

const shot = ProjectStateSchema.parse({
  project_id: "project",
  keys: [],
  shots: [
    {
      timeline_id: "shot",
      shot_index: 0,
      sequence_id: 1,
      video_prompt: "Original",
      dialogue: [],
      tags: { characters: ["HERO"], environments: [], props: [] },
      references: { characters: [{ token: "HERO", asset_id: "hero-image" }] }
    }
  ]
}).shots[0]!;
const shotWithoutReferences = {
  ...shot,
  tags: { characters: [], environments: [], props: [] },
  references: {}
};
const shotWithTaggedReferenceWithoutImage = {
  ...shot,
  references: {},
  missing_references: [{ token: "HERO", reason: "no image" }]
};
const storyboardWithImage = {
  latestStoryboardImage: undefined,
  isStoryboardRendering: false,
  hasLatestStoryboardRenderFailed: false,
  latestFinishedStoryboardImageUrl: "https://example.com/storyboard.png"
};
const storyboardWithoutImage = {
  latestStoryboardImage: undefined,
  isStoryboardRendering: false,
  hasLatestStoryboardRenderFailed: false,
  latestFinishedStoryboardImageUrl: undefined
};
const setup = ({
  heading = "1 Opening",
  isBusy = false,
  isRenderDisabled = false,
  rerenderCost = { kind: "credits", amount: 1 },
  shotUnderTest = shot,
  isShotBlockedForNoReferenceImage = false,
  scenesView = "video",
  storyboard = storyboardWithoutImage,
  sceneStoryboard,
  cutShotUnderTest,
  hasShotChangedSinceRender = true,
  changedPaths
}: {
  heading?: string | null;
  isBusy?: boolean;
  isRenderDisabled?: boolean;
  rerenderCost?: ScriptProjectRenderCost;
  shotUnderTest?: typeof shot;
  isShotBlockedForNoReferenceImage?: boolean;
  scenesView?: ScenesView;
  storyboard?: ShotStoryboard;
  sceneStoryboard?: SceneStoryboardView;
  cutShotUnderTest?: CutShot;
  hasShotChangedSinceRender?: boolean;
  changedPaths?: string[];
} = {}) => {
  const onSaveSceneShots = vi.fn(),
    onSaveHeading = vi.fn(),
    onRetryRender = vi.fn(),
    onGenerateStoryboard = vi.fn(),
    onChangeStoryboardVideoUse = vi.fn(),
    onPinStoryboardVersion = vi.fn(),
    onToggleLocked = vi.fn();
  const storyboardView =
    sceneStoryboard ??
    describeSceneStoryboardFromSheets({
      shotStoryboard: storyboard,
      isStoryboardTaggedOnScene: shotUnderTest.tags.props.includes(
        buildStoryboardSheetToken(shotUnderTest.timeline_id)
      )
    });
  const renderRow = (isRowBusy: boolean) => (
    <ShotRow
      projectId="project"
      onSaveHeading={onSaveHeading}
      shot={{ ...shotUnderTest, heading }}
      sequentialBlockedLabelKey={null}
      isSequentialReferenceIgnored={false}
      isShotBlockedForNoReferenceImage={isShotBlockedForNoReferenceImage}
      sheetGroups={[]}
      cutShot={cutShotUnderTest}
      imageUrlsByAssetId={new Map()}
      isRendering={false}
      hasFailedPlanStep={false}
      shotFrames={120}
      outputSize={[1024, 576]}
      estimateRerenderCost={() => rerenderCost}
      hasShotChangedSinceRender={hasShotChangedSinceRender}
      changedPaths={changedPaths}
      onSaveSceneShots={onSaveSceneShots}
      onRetryRender={onRetryRender}
      onReuseVersionSettings={vi.fn()}
      onSaveTags={vi.fn()}
      storyboard={storyboardView}
      scenesView={scenesView}
      scenesLayout="cards"
      storyboardCost={{ kind: "credits", amount: 2 }}
      isStoryboardSubmitting={false}
      canGenerateStoryboard
      onGenerateStoryboard={onGenerateStoryboard}
      onChangeStoryboardVideoUse={onChangeStoryboardVideoUse}
      onPinStoryboardVersion={onPinStoryboardVersion}
      isUpdatingStoryboard={false}
      onPinVersion={vi.fn()}
      onToggleHidden={vi.fn()}
      onToggleLocked={onToggleLocked}
      dragHandle={null}
      isBusy={isRowBusy}
      isLockPending={false}
      isRenderDisabled={isRenderDisabled}
    />
  );
  const screen = renderWithProviders(renderRow(isBusy));
  const setRowBusy = (isRowBusy: boolean) =>
    screen.rerender(renderRow(isRowBusy));
  return {
    ...screen,
    setRowBusy,
    onSaveSceneShots,
    onSaveHeading,
    onRetryRender,
    onGenerateStoryboard,
    onChangeStoryboardVideoUse,
    onToggleLocked
  };
};
describe("scene shot table", () => {
  it("replaces the prompt and dialogue fields with one shot seeded from the scene", () => {
    const screen = setup();
    expect(screen.queryByTestId("shot-prompt-1")).toBeNull();
    expect(screen.queryByTestId("shot-dialogue-1")).toBeNull();
    expect(screen.getByTestId("scene-shot-table-1-shot-1")).toBeTruthy();
    expect(screen.queryByTestId("scene-shot-table-1-shot-2")).toBeNull();
  });
  it("saves the edited shots into the scene prompt when focus leaves the table", () => {
    const screen = setup();
    const description = screen.getByDisplayValue("Original");
    fireEvent.change(description, { target: { value: "Edited" } });
    fireEvent.blur(description);
    expect(screen.onSaveSceneShots).toHaveBeenCalledWith({
      videoPrompt: "Edited",
      dialogue: []
    });
  });
  it("keeps the last shot in a scene from being deleted", () => {
    const screen = setup();
    expect(screen.getByTestId("scene-shot-table-1-delete-1")).toBeDisabled();
  });
  it("deletes a shot once the scene has another one", () => {
    const screen = setup();
    fireEvent.click(screen.getByTestId("scene-shot-table-1-add"));
    expect(
      screen.getByTestId("scene-shot-table-1-delete-1")
    ).not.toBeDisabled();
    fireEvent.click(screen.getByTestId("scene-shot-table-1-delete-2"));
    expect(screen.queryByTestId("scene-shot-table-1-shot-2")).toBeNull();
    expect(screen.getByTestId("scene-shot-table-1-delete-1")).toBeDisabled();
  });
  it("does not save a shot that was added but never given a prompt", () => {
    const screen = setup();
    const addShotButton = screen.getByTestId("scene-shot-table-1-add");
    fireEvent.click(addShotButton);
    fireEvent.blur(addShotButton);
    expect(screen.getByTestId("scene-shot-table-1-shot-2")).toBeTruthy();
    expect(screen.onSaveSceneShots).not.toHaveBeenCalled();
  });
  it("does not save a scene whose shots are untouched", () => {
    const screen = setup();
    fireEvent.blur(screen.getByDisplayValue("Original"));
    expect(screen.onSaveSceneShots).not.toHaveBeenCalled();
  });
  it("hands unsaved shot edits to rendering when focus moves directly to Generate", () => {
    const screen = setup();
    const description = screen.getByDisplayValue("Original");
    const render = screen.getByTestId("shot-rerender-1");
    fireEvent.change(description, { target: { value: "Edited" } });
    fireEvent.blur(description, { relatedTarget: render });
    fireEvent.click(render);
    expect(screen.onSaveSceneShots).not.toHaveBeenCalled();
    expect(screen.onRetryRender).toHaveBeenCalledWith(
      expect.objectContaining({
        videoPrompt: "Edited",
        hasUnsavedPrompt: true
      })
    );
  });
});
describe("Storyboard and Video views", () => {
  it("shows the storyboard and Generate storyboard in the Storyboard view, without the video controls", () => {
    const screen = setup({ scenesView: "storyboard" });
    expect(screen.getByTestId("shot-storyboard-version-1")).toBeTruthy();
    expect(screen.getByTestId("shot-generate-storyboard-1")).toBeTruthy();
    expect(screen.queryByTestId("shot-rerender-1")).toBeNull();
    expect(screen.getByTestId("scene-shot-table-1")).toBeTruthy();
  });
  it("sends the drafted shots as storyboard panels", () => {
    const screen = setup({ scenesView: "storyboard" });
    fireEvent.click(screen.getByTestId("shot-generate-storyboard-1"));
    expect(screen.onGenerateStoryboard).toHaveBeenCalledWith({
      storyboardBeats: [expect.objectContaining({ action: "Original" })],
      unsavedSceneShotEdits: {}
    });
  });
  it("shows Generate and no storyboard controls in the Video view", () => {
    const screen = setup({ scenesView: "video" });
    expect(screen.getByTestId("shot-rerender-1")).toBeTruthy();
    expect(screen.queryByTestId("shot-generate-storyboard-1")).toBeNull();
    expect(screen.queryByTestId("shot-storyboard-version-1")).toBeNull();
  });
  it("lists an attached storyboard among the Video view references and removes it on request", () => {
    const screen = setup({
      scenesView: "video",
      storyboard: storyboardWithImage,
      shotUnderTest: {
        ...shot,
        tags: { ...shot.tags, props: ["storyboard_shot"] }
      }
    });
    fireEvent.click(screen.getByTestId("shot-storyboard-reference-1-remove"));
    expect(screen.onChangeStoryboardVideoUse).toHaveBeenCalledWith(false);
  });
  it("leaves a storyboard removed from the scene out of the Video view references", () => {
    const screen = setup({
      scenesView: "video",
      storyboard: storyboardWithImage
    });
    expect(screen.queryByTestId("shot-storyboard-reference-1")).toBeNull();
  });
  it("still shows a storyboard removed from the scene in the Storyboard view", () => {
    const screen = setup({
      scenesView: "storyboard",
      storyboard: storyboardWithImage
    });
    expect(screen.getByTestId("shot-storyboard-version-1-image")).toBeTruthy();
  });
});
describe("scene storyboard from the backend", () => {
  const backendStoryboard = (summary: Record<string, unknown>) =>
    describeSceneStoryboardFromBackend(
      ProjectStateSchema.parse({
        project_id: "project",
        keys: [],
        shots: [
          {
            timeline_id: "shot",
            shot_index: 0,
            sequence_id: 1,
            storyboard: summary
          }
        ]
      }).shots[0]!.storyboard!
    );

  it("says a stale storyboard is out of date and that the video renders without it", () => {
    const sceneStoryboard = backendStoryboard({
      status: "stale",
      image_url: "https://example.com/storyboard.png",
      version_count: 1
    });

    const storyboardScreen = setup({
      scenesView: "storyboard",
      sceneStoryboard
    });
    expect(
      storyboardScreen.getByTestId("shot-storyboard-stale-1")
    ).toBeTruthy();
    storyboardScreen.unmount();

    const videoScreen = setup({ sceneStoryboard });
    expect(
      videoScreen.getByTestId("shot-video-without-stale-storyboard-1")
    ).toBeTruthy();
    expect(videoScreen.queryByTestId("shot-storyboard-reference-1")).toBeNull();
  });

  it("hints at a failed last attempt while the earlier version stays in use", () => {
    const screen = setup({
      scenesView: "storyboard",
      sceneStoryboard: backendStoryboard({
        status: "ready",
        image_url: "https://example.com/storyboard.png",
        last_attempt_failed: true,
        version_count: 2
      })
    });
    expect(
      screen.getByTestId("shot-storyboard-last-attempt-failed-1")
    ).toBeTruthy();
    expect(screen.queryByTestId("shot-storyboard-failed-1")).toBeNull();
  });

  it("switches the storyboard off for video renders and offers its versions", () => {
    const screen = setup({
      scenesView: "storyboard",
      sceneStoryboard: backendStoryboard({
        status: "ready",
        image_url: "https://example.com/storyboard.png",
        version_count: 2
      })
    });
    expect(screen.getByTestId("shot-storyboard-versions-1")).toHaveTextContent(
      "2"
    );
    fireEvent.click(screen.getByRole("switch"));
    expect(screen.onChangeStoryboardVideoUse).toHaveBeenCalledWith(false);
  });

  it("refuses to draw a scene whose drafted shots exceed 15", () => {
    const sixteenShotPrompt = Array.from(
      { length: 16 },
      (_, shotIndex) =>
        `[Shot ${shotIndex + 1}] (${shotIndex}-${shotIndex + 1}s) Beat ${shotIndex + 1}.`
    ).join("\n");
    const screen = setup({
      scenesView: "storyboard",
      shotUnderTest: { ...shot, video_prompt: sixteenShotPrompt },
      sceneStoryboard: backendStoryboard({ status: "missing", shot_count: 1 })
    });
    expect(screen.getByTestId("shot-generate-storyboard-1")).toBeDisabled();
    expect(screen.getByTestId("shot-storyboard-too-many-shots-1")).toBeTruthy();
  });

  it("shows a failed storyboard as failed on its card, not as missing", () => {
    const screen = setup({
      scenesView: "storyboard",
      sceneStoryboard: backendStoryboard({ status: "failed", version_count: 1 })
    });
    expect(screen.getByTestId("shot-storyboard-version-1-failed")).toBeTruthy();
  });
});

describe("failed storyboard", () => {
  const failedStoryboard: ShotStoryboard = {
    latestStoryboardImage: {
      asset_id: "failed",
      clip_id: "failed-clip",
      status: "failed",
      source: "render",
      url: null,
      thumbnail_url: null,
      has_description: false
    },
    isStoryboardRendering: false,
    hasLatestStoryboardRenderFailed: true,
    latestFinishedStoryboardImageUrl: undefined
  };

  it("shows the failure where the storyboard goes and says so under the card", () => {
    const screen = setup({
      scenesView: "storyboard",
      storyboard: failedStoryboard
    });

    expect(screen.getByTestId("shot-storyboard-version-1-failed")).toBeTruthy();
    expect(screen.getByTestId("shot-storyboard-failed-1")).toBeTruthy();
  });

  it("keeps the previous storyboard visible when only the newer one failed", () => {
    const screen = setup({
      scenesView: "storyboard",
      storyboard: {
        ...failedStoryboard,
        latestFinishedStoryboardImageUrl: "https://example.com/previous.png"
      }
    });

    expect(screen.getByTestId("shot-storyboard-version-1-image")).toBeTruthy();
    expect(
      screen.getByTestId("shot-storyboard-last-attempt-failed-1")
    ).toBeTruthy();
    expect(screen.queryByTestId("shot-storyboard-failed-1")).toBeNull();
  });

  it("tells the Video view the scene renders without its failed storyboard", () => {
    const screen = setup({ storyboard: failedStoryboard });

    expect(
      screen.getByTestId("shot-video-without-storyboard-1")
    ).toHaveTextContent(
      "This scene's storyboard failed. The video renders without it."
    );
  });

  it("says nothing in the Video view when an earlier storyboard still stands in", () => {
    const screen = setup({
      storyboard: {
        ...failedStoryboard,
        latestFinishedStoryboardImageUrl: "https://example.com/previous.png"
      }
    });

    expect(screen.queryByTestId("shot-video-without-storyboard-1")).toBeNull();
  });
});

describe("shot title editing", () => {
  it("renames the Shot on double-click and Enter", () => {
    const screen = setup();
    fireEvent.doubleClick(screen.getByText("1 Opening"));
    const titleInput = screen.getByDisplayValue("1 Opening");
    fireEvent.change(titleInput, {
      target: { value: "1.1 Entering the house" }
    });
    fireEvent.keyDown(titleInput, { key: "Enter" });
    fireEvent.blur(titleInput);
    expect(screen.onSaveHeading).toHaveBeenCalledWith("1.1 Entering the house");
  });
  it("shows the default name when the Shot has no title", () => {
    const screen = setup({ heading: null });
    expect(screen.getByText("New scene")).toBeTruthy();
  });
  it("keeps the title read-only while the strip is busy", () => {
    const screen = setup({ isBusy: true });
    fireEvent.doubleClick(screen.getByText("1 Opening"));
    expect(screen.queryByDisplayValue("1 Opening")).toBeNull();
  });
  it("keeps an open title editor when the strip becomes busy", () => {
    const screen = setup();
    fireEvent.doubleClick(screen.getByText("1 Opening"));
    fireEvent.change(screen.getByDisplayValue("1 Opening"), {
      target: { value: "1 Prologue" }
    });
    screen.setRowBusy(true);
    const titleInput = screen.getByDisplayValue("1 Prologue");
    fireEvent.blur(titleInput);
    expect(screen.onSaveHeading).toHaveBeenCalledWith("1 Prologue");
  });
});
describe("scene reference image gate", () => {
  it("disables Generate and explains why when the dry run blocks the scene for no reference image", () => {
    const screen = setup({
      shotUnderTest: shotWithoutReferences,
      isShotBlockedForNoReferenceImage: true
    });
    fireEvent.click(screen.getByTestId("shot-rerender-1"));
    expect(screen.onRetryRender).not.toHaveBeenCalled();
    expect(screen.getByTestId("shot-no-reference-image-1")).toBeTruthy();
  });
  it("leaves Generate enabled when the dry run does not block the scene", () => {
    const screen = setup({ shotUnderTest: shotWithoutReferences });
    fireEvent.click(screen.getByTestId("shot-rerender-1"));
    expect(screen.onRetryRender).toHaveBeenCalled();
    expect(screen.queryByTestId("shot-no-reference-image-1")).toBeNull();
  });
  it("disables Generate while local rendering is not ready", () => {
    const screen = setup({
      shotUnderTest: shotWithoutReferences,
      isRenderDisabled: true
    });
    expect(screen.getByTestId("shot-rerender-1")).toBeDisabled();
  });
  it("labels a local render Local instead of a credit price", () => {
    const screen = setup({
      shotUnderTest: shotWithoutReferences,
      rerenderCost: { kind: "local" }
    });
    expect(screen.getByTestId("shot-rerender-1")).toHaveTextContent("Local");
  });
  it("names the tagged reference that has no image", () => {
    const screen = setup({
      shotUnderTest: shotWithTaggedReferenceWithoutImage
    });
    expect(screen.getByText("Blocked — HERO has no pinned image")).toBeTruthy();
    expect(screen.queryByTestId("shot-no-reference-image-1")).toBeNull();
  });
});
describe("scene length on Generate", () => {
  const shotWithTwoTimedShots = {
    ...shot,
    video_prompt: "[Shot 1] (0-3s) Hero enters.\n[Shot 2] (3-8s) Hero sits."
  };
  it("sums the shot-table rows into the length shown on Generate", () => {
    const screen = setup({ shotUnderTest: shotWithTwoTimedShots });
    expect(screen.getByTestId("shot-rerender-1").textContent).toContain(
      "Generate (8 sec)"
    );
  });
  it("saves a cleared duration as the 1 second minimum", () => {
    const screen = setup({ shotUnderTest: shotWithTwoTimedShots });
    const firstShotDuration = screen.getByTestId(
      "scene-shot-table-1-duration-1"
    );
    fireEvent.focus(firstShotDuration);
    fireEvent.change(firstShotDuration, { target: { value: "" } });
    fireEvent.blur(firstShotDuration);

    expect(firstShotDuration).toHaveValue(1);
    expect(screen.onSaveSceneShots).toHaveBeenCalledWith(
      expect.objectContaining({
        videoPrompt: "[Shot 1] (0-1s) Hero enters.\n[Shot 2] (1-6s) Hero sits.",
        durationSeconds: 6
      })
    );
  });
  it("follows a row's duration while it is being edited", () => {
    const screen = setup({ shotUnderTest: shotWithTwoTimedShots });
    const [firstShotDuration] = screen.getAllByLabelText("Duration (s)");
    fireEvent.change(firstShotDuration!, { target: { value: "4" } });
    expect(screen.getByTestId("shot-rerender-1").textContent).toContain(
      "Generate (9 sec)"
    );
  });
});
describe("locked scene", () => {
  const cutShotWithTwoVersions = ProjectCutSchema.parse({
    project_id: "project",
    shots: [
      {
        timeline_id: "shot",
        shot_index: 0,
        sequence_id: 1,
        pinned_asset_id: "shown",
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
            status: "finished"
          }
        ]
      }
    ]
  }).shots[0]!;
  const lockedShot = { ...shot, locked: true };

  it("drops the version column when the pinned video is the only version", () => {
    const screen = setup({
      cutShotUnderTest: {
        ...cutShotWithTwoVersions,
        versions: cutShotWithTwoVersions.versions.slice(0, 1)
      }
    });
    expect(screen.queryByTestId("version-strip")).toBeNull();
  });

  it("keeps an unlocked scene editable with its versions", () => {
    const screen = setup({ cutShotUnderTest: cutShotWithTwoVersions });
    expect(screen.getByTestId("version-strip")).toBeTruthy();
    expect(screen.getByDisplayValue("Original")).not.toBeDisabled();
  });

  it("hides the versions, disables every input and dims everything but the video once locked", () => {
    const screen = setup({
      shotUnderTest: lockedShot,
      cutShotUnderTest: cutShotWithTwoVersions
    });

    expect(screen.queryByTestId("version-strip")).toBeNull();
    expect(screen.getByDisplayValue("Original")).toBeDisabled();
    expect(screen.getByTestId("scene-shot-table-1-add")).toBeDisabled();
    expect(screen.getByTestId("shot-rerender-1")).toBeDisabled();
    expect(screen.getByTestId("shot-hide-1")).toBeDisabled();
    expect(screen.getByTestId("shot-card-details-1").className).toContain(
      "opacity-50"
    );
    expect(
      screen.getByTestId("shot-card-details-1").parentElement?.className
    ).not.toContain("opacity-50");
  });

  it("drops every notice under the card once locked", () => {
    const sceneWithEveryNotice = {
      cutShotUnderTest: cutShotWithTwoVersions,
      changedPaths: ["video_prompt"],
      isShotBlockedForNoReferenceImage: true
    };
    const unlockedScreen = setup(sceneWithEveryNotice);
    expect(unlockedScreen.getByTestId("shot-changed-1")).toBeTruthy();
    expect(
      unlockedScreen.getByTestId("shot-no-reference-image-1")
    ).toBeTruthy();
    unlockedScreen.unmount();

    const lockedScreen = setup({
      ...sceneWithEveryNotice,
      shotUnderTest: lockedShot
    });
    expect(lockedScreen.queryByTestId("shot-changed-1")).toBeNull();
    expect(lockedScreen.queryByTestId("shot-no-reference-image-1")).toBeNull();
  });

  it("keeps the lock pressable so the scene can be unlocked, even on the Storyboard tab", () => {
    const screen = setup({
      shotUnderTest: lockedShot,
      cutShotUnderTest: cutShotWithTwoVersions,
      scenesView: "storyboard"
    });

    expect(screen.getByTestId("shot-generate-storyboard-1")).toBeDisabled();
    expect(screen.getByTestId("shot-lock-1")).not.toBeDisabled();
    fireEvent.click(screen.getByTestId("shot-lock-1"));
    expect(screen.onToggleLocked).toHaveBeenCalledTimes(1);
  });

  it("offers the lock on an unlocked scene that has a version", () => {
    const screen = setup({ cutShotUnderTest: cutShotWithTwoVersions });

    expect(screen.getByTestId("shot-lock-1").getAttribute("aria-pressed")).toBe(
      "false"
    );
    fireEvent.click(screen.getByTestId("shot-lock-1"));
    expect(screen.onToggleLocked).toHaveBeenCalledTimes(1);
  });
});

describe("scene with no changes since its last version", () => {
  const cutShotWithOneVersion = ProjectCutSchema.parse({
    project_id: "project",
    shots: [
      {
        timeline_id: "shot",
        shot_index: 0,
        sequence_id: 1,
        pinned_asset_id: "shown",
        versions: [
          {
            layer_id: "layer",
            asset_id: "shown",
            created_at: "2026-10-02T12:00:00Z",
            ready: true,
            status: "finished"
          }
        ]
      }
    ]
  }).shots[0]!;

  it("disables Generate and says nothing changed since the last generation", () => {
    const screen = setup({
      cutShotUnderTest: cutShotWithOneVersion,
      hasShotChangedSinceRender: false
    });

    expect(screen.getByTestId("shot-rerender-1")).toBeDisabled();
    expect(screen.getByTestId("shot-generate-no-changes-1")).toBeTruthy();
  });

  it("drops the note once the scene changes", () => {
    const screen = setup({ cutShotUnderTest: cutShotWithOneVersion });

    expect(screen.queryByTestId("shot-generate-no-changes-1")).toBeNull();
  });

  it("drops the note when the scene is locked", () => {
    const screen = setup({
      shotUnderTest: { ...shot, locked: true },
      cutShotUnderTest: cutShotWithOneVersion,
      hasShotChangedSinceRender: false
    });

    expect(screen.queryByTestId("shot-generate-no-changes-1")).toBeNull();
  });
});
