import { getQueryClient } from "@config/queryClient";
import { buildStoryboardSheetToken } from "@domains/scriptProject/utils/buildStoryboardSheetToken";
import { describeSceneStoryboardFromBackend } from "@domains/scriptProject/utils/describeSceneStoryboardFromBackend";
import { describeSceneStoryboardFromSheets } from "@domains/scriptProject/utils/describeSceneStoryboardFromSheets";
import { ShotStoryboard } from "@domains/scriptProject/utils/findShotStoryboard";
import { RenderMetrics } from "@domains/scriptProject/utils/renderMetricsTypes";
import { SceneStoryboardView } from "@domains/scriptProject/utils/sceneStoryboardView";
import { GenerateRunButton } from "@home/script-project/components/GenerateRunButton";
import { NothingToGenerateReason } from "@home/script-project/components/NothingToGenerateReason";
import { ShotRow } from "@home/script-project/components/ShotRow";
import { ScenesLayout } from "@home/script-project/components/utils/scenesLayout";
import { ScenesView } from "@home/script-project/components/utils/scenesView";
import {
  CutShot,
  CutShotVersion,
  ProjectStateSchema,
  SheetGroup,
  SheetGroupSchema,
  ShotState
} from "@schemas/scriptProject";
import { buildUserScopedStorageKey } from "@store/utils/buildUserScopedStorageKey";
import { Meta, StoryObj } from "@storybook/react-vite";
import { createProject } from "@tests/factories/project";
import React from "react";

import { queryKeys } from "@/queryKeys";

const PROJECT_ID = "storybook-scene-states";
const STORYBOOK_USER_ID = "user_storybook";
const LANDSCAPE_OUTPUT_SIZE: [number, number] = [1280, 720];
const PORTRAIT_OUTPUT_SIZE: [number, number] = [720, 1280];
const SHOT_FRAMES = 120;
const STORYBOARD_CREDITS = 50;

const buildSvgDataUrl = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const buildPosterUrl = (
  [widthPx, heightPx]: [number, number],
  hueDegrees: number
) =>
  buildSvgDataUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${widthPx}' height='${heightPx}'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hueDegrees},45%,40%)'/><stop offset='1' stop-color='hsl(${hueDegrees + 50},45%,12%)'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/></svg>`
  );

const STORYBOARD_IMAGE_URL = buildSvgDataUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='1536' height='864'><rect width='100%' height='100%' fill='white'/>${[
    0, 1, 2
  ]
    .map(
      (panelIndex) =>
        `<rect x='${80 + panelIndex * 470}' y='250' width='430' height='300' fill='none' stroke='black' stroke-width='8'/><circle cx='${100 + panelIndex * 470}' cy='215' r='22' fill='none' stroke='black' stroke-width='4'/><text x='${92 + panelIndex * 470}' y='226' font-size='30' font-family='sans-serif'>${panelIndex + 1}</text>`
    )
    .join("")}</svg>`
);

const HERO_IMAGE_URL = buildPosterUrl([512, 512], 20);

const SHEET_GROUPS: SheetGroup[] = [
  SheetGroupSchema.parse({
    token: "hero",
    name: "Hero",
    kind: "character",
    layer_id: "hero-layer",
    selected_asset_id: "hero-image",
    effective_asset_id: "hero-image",
    images: [
      {
        asset_id: "hero-image",
        clip_id: "hero-clip",
        name: "hero_v2",
        status: "success",
        url: null,
        thumbnail_url: null
      }
    ]
  }),
  SheetGroupSchema.parse({
    token: "villain",
    name: "Villain",
    kind: "character",
    layer_id: "villain-layer",
    images: []
  })
];

const IMAGE_URLS_BY_ASSET_ID = new Map([
  ["hero-image", { url: HERO_IMAGE_URL, thumbnailUrl: HERO_IMAGE_URL }]
]);

const THREE_SHOT_PROMPT = [
  "[Shot 1] (0-3s) Wide. The hero walks onto the old bridge at night.",
  "[Shot 2] (3-6s) Medium close-up. She stops and looks at the river. Camera: Slow push in.",
  "[Shot 3] (6-8s) Close-up. Her hand drops an empty can into the water."
].join("\n");

const buildScene = (
  timelineId: string,
  overrides: Partial<ShotState> = {}
): ShotState => ({
  ...ProjectStateSchema.parse({
    project_id: PROJECT_ID,
    keys: [],
    shots: [
      {
        timeline_id: timelineId,
        shot_index: 0,
        sequence_id: 1,
        heading: "1.1 OLD STONE BRIDGE",
        video_prompt: THREE_SHOT_PROMPT,
        duration_s: 8,
        tags: { characters: ["hero"], environments: [], props: [] },
        references: {
          characters: [{ token: "hero", asset_id: "hero-image" }]
        }
      }
    ]
  }).shots[0]!,
  ...overrides
});

const buildVersion = (
  assetId: string,
  outputSize: [number, number],
  overrides: Partial<CutShotVersion> = {}
): CutShotVersion => ({
  layer_id: `layer-${assetId}`,
  asset_id: assetId,
  name: `Shot renders (1) — Agent Render (${assetId})`,
  ready: true,
  status: "finished",
  url: null,
  poster_url: buildPosterUrl(outputSize, assetId.length * 37),
  upscale_of: null,
  timeline_upscale_of: null,
  created_at: "2026-10-27T10:00:00Z",
  input_settings: null,
  render_spec: {
    settings: { engine: "minimax_h3_max" },
    output_size: outputSize
  },
  ...overrides
});

const buildCutShot = (
  timelineId: string,
  versions: CutShotVersion[],
  pinnedAssetId: string | null = null
): CutShot => ({
  timeline_id: timelineId,
  shot_index: 0,
  sequence_id: 1,
  heading: "1.1 OLD STONE BRIDGE",
  asset_id: pinnedAssetId ?? versions[0]?.asset_id ?? null,
  pinned_asset_id: pinnedAssetId,
  version_name: null,
  is_upscale: false,
  url: null,
  poster_url: null,
  versions
});

const buildVersionsNewestFirst = (
  prefix: string,
  count: number,
  outputSize: [number, number]
) =>
  Array.from({ length: count }, (_, newestFirstIndex) =>
    buildVersion(`${prefix}-${count - newestFirstIndex}`, outputSize, {
      created_at: `2026-10-${String(27 - newestFirstIndex).padStart(2, "0")}T10:00:00Z`
    })
  );

const NO_STORYBOARD: ShotStoryboard = {
  latestStoryboardImage: undefined,
  isStoryboardRendering: false,
  hasLatestStoryboardRenderFailed: false,
  latestFinishedStoryboardImageUrl: undefined
};

const FINISHED_STORYBOARD: ShotStoryboard = {
  latestStoryboardImage: undefined,
  isStoryboardRendering: false,
  hasLatestStoryboardRenderFailed: false,
  latestFinishedStoryboardImageUrl: STORYBOARD_IMAGE_URL
};

const FAILED_ONLY_STORYBOARD: ShotStoryboard = {
  latestStoryboardImage: {
    asset_id: "storyboard-failed",
    clip_id: "storyboard-failed-clip",
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

const metricsWithScore = (
  score: number,
  hasEvaluatorPassed: boolean
): RenderMetrics => ({
  status: "COMPLETED",
  evalMode: null,
  score,
  hasEvaluatorPassed,
  scoreByAxis: {},
  issues: [],
  nextPrompt: null,
  evaluationError: null
});

const seedStoryData = () => {
  const queryClient = getQueryClient();
  queryClient.setQueryData(
    queryKeys.project.byId(PROJECT_ID),
    createProject({
      id: PROJECT_ID,
      settings: { shot_engine: "minimax_h3_max" },
      timelines: []
    })
  );
  const allVersionIds = [
    ...buildVersionsNewestFirst("several", 6, LANDSCAPE_OUTPUT_SIZE),
    ...buildVersionsNewestFirst("portrait", 5, PORTRAIT_OUTPUT_SIZE),
    ...buildVersionsNewestFirst("list", 3, LANDSCAPE_OUTPUT_SIZE),
    buildVersion("single", LANDSCAPE_OUTPUT_SIZE),
    buildVersion("portrait-single", PORTRAIT_OUTPUT_SIZE),
    buildVersion("approved", LANDSCAPE_OUTPUT_SIZE),
    buildVersion("changed", LANDSCAPE_OUTPUT_SIZE)
  ].map((version) => version.asset_id);
  allVersionIds.forEach((assetId, index) =>
    queryClient.setQueryData(
      ["renderMetrics", "video", assetId],
      index % 3 === 0
        ? metricsWithScore(8.4, true)
        : index % 3 === 1
          ? metricsWithScore(4.1, false)
          : { ...metricsWithScore(0, false), status: "PENDING", score: null }
    )
  );
  try {
    const reviewKey = buildUserScopedStorageKey("shot-version-review", {
      level: "project",
      userId: STORYBOOK_USER_ID,
      projectId: PROJECT_ID
    });
    if (reviewKey)
      window.localStorage.setItem(
        reviewKey,
        JSON.stringify({
          viewed: allVersionIds.filter((assetId) => assetId !== "several-6"),
          ratings: {},
          isBaselineRecorded: true
        })
      );
  } catch {
    return;
  }
};

seedStoryData();

type SceneCardExample = {
  title: string;
  note?: string;
  isGap?: boolean;
  shot: ShotState;
  cutShot?: CutShot;
  storyboard?: ShotStoryboard;
  sceneStoryboard?: SceneStoryboardView;
  outputSize?: [number, number];
  isRendering?: boolean;
  isStoryboardSubmitting?: boolean;
  canGenerateStoryboard?: boolean;
  hasShotChangedSinceRender?: boolean;
  changedPaths?: string[];
  isShotBlockedForNoReferenceImage?: boolean;
  sequentialBlockedLabelKey?: string | null;
  isSequentialReferenceIgnored?: boolean;
  isBusy?: boolean;
};

const doNothing = () => undefined;

const SceneCard = ({
  example,
  scenesView,
  scenesLayout
}: {
  example: SceneCardExample;
  scenesView: ScenesView;
  scenesLayout: ScenesLayout;
}) => (
  <ShotRow
    projectId={PROJECT_ID}
    onSaveHeading={doNothing}
    onReuseVersionSettings={doNothing}
    shot={example.shot}
    sequentialBlockedLabelKey={example.sequentialBlockedLabelKey ?? null}
    isSequentialReferenceIgnored={example.isSequentialReferenceIgnored ?? false}
    isShotBlockedForNoReferenceImage={
      example.isShotBlockedForNoReferenceImage ?? false
    }
    sheetGroups={SHEET_GROUPS}
    cutShot={example.cutShot}
    imageUrlsByAssetId={IMAGE_URLS_BY_ASSET_ID}
    isRendering={example.isRendering ?? false}
    hasFailedPlanStep={false}
    shotFrames={SHOT_FRAMES}
    outputSize={example.outputSize ?? LANDSCAPE_OUTPUT_SIZE}
    estimateRerenderCost={(sceneDurationSeconds) => ({
      kind: "credits",
      amount: Math.round((sceneDurationSeconds ?? 5) * 204)
    })}
    hasShotChangedSinceRender={example.hasShotChangedSinceRender ?? true}
    changedPaths={example.changedPaths}
    onSaveSceneShots={doNothing}
    onSaveTags={doNothing}
    voicedCharacterTokens={new Set()}
    characterNamesWithoutVoice={[]}
    untaggedSpeakers={[]}
    onRetryRender={doNothing}
    onPinVersion={doNothing}
    storyboard={
      example.sceneStoryboard ??
      describeSceneStoryboardFromSheets({
        shotStoryboard: example.storyboard ?? NO_STORYBOARD,
        isStoryboardTaggedOnScene: example.shot.tags.props.includes(
          buildStoryboardSheetToken(example.shot.timeline_id)
        )
      })
    }
    scenesView={scenesView}
    scenesLayout={scenesLayout}
    storyboardCost={{ kind: "credits", amount: STORYBOARD_CREDITS }}
    isStoryboardSubmitting={example.isStoryboardSubmitting ?? false}
    canGenerateStoryboard={example.canGenerateStoryboard ?? true}
    onGenerateStoryboard={doNothing}
    onChangeStoryboardVideoUse={doNothing}
    onPinStoryboardVersion={doNothing}
    isUpdatingStoryboard={false}
    onToggleHidden={doNothing}
    onToggleLocked={doNothing}
    dragHandle={null}
    isBusy={example.isBusy ?? false}
    isLockPending={false}
    isRenderDisabled={false}
  />
);

const ExampleLabel = ({ example }: { example: SceneCardExample }) => (
  <div className="flex max-w-[432px] flex-col gap-1">
    <p className="font-lato text-sm font-semibold text-glyph-primary">
      {example.isGap ? "⚠ " : ""}
      {example.title}
    </p>
    {example.note && (
      <p
        className={
          example.isGap
            ? "font-lato text-xs text-glyph-warning"
            : "font-lato text-xs text-glyph-tertiary"
        }
      >
        {example.note}
      </p>
    )}
  </div>
);

const ScrollablePage = ({ children }: { children: React.ReactNode }) => (
  <div className="h-screen overflow-y-auto bg-surface-primary">{children}</div>
);

const StatesGallery = ({
  heading,
  examples,
  scenesView,
  scenesLayout = "cards"
}: {
  heading: string;
  examples: SceneCardExample[];
  scenesView: ScenesView;
  scenesLayout?: ScenesLayout;
}) => (
  <div className="flex flex-col gap-6 p-8">
    <p className="font-lato text-xl font-semibold text-glyph-primary">
      {heading}
    </p>
    <div
      className={
        scenesLayout === "list"
          ? "flex flex-col gap-10"
          : "flex flex-wrap items-start gap-x-6 gap-y-10"
      }
    >
      {examples.map((example) => (
        <div key={example.title} className="flex flex-col gap-3">
          <ExampleLabel example={example} />
          <SceneCard
            example={example}
            scenesView={scenesView}
            scenesLayout={scenesLayout}
          />
        </div>
      ))}
    </div>
  </div>
);

const STORYBOARD_TAB_EXAMPLES: SceneCardExample[] = [
  {
    title: "No shots yet",
    note: "One empty shot row. Generate storyboard stays disabled with no hint why.",
    isGap: true,
    shot: buildScene("storyboard-empty", { video_prompt: "", duration_s: null })
  },
  {
    title: "Shots written, no storyboard yet",
    shot: buildScene("storyboard-none")
  },
  {
    title: "Storyboard rendering",
    shot: buildScene("storyboard-rendering"),
    isStoryboardSubmitting: true
  },
  {
    title: "Storyboard out of date",
    note: "Scene storyboard backend. The shots changed since it was drawn, so video renders skip it.",
    shot: buildScene("storyboard-stale"),
    sceneStoryboard: describeSceneStoryboardFromBackend({
      status: "stale",
      shot_count: 1,
      enabled: true,
      image_url: STORYBOARD_IMAGE_URL,
      version_count: 2,
      last_attempt_failed: false
    })
  },
  {
    title: "Last storyboard attempt failed",
    note: "Scene storyboard backend. The earlier version stays in use.",
    shot: buildScene("storyboard-last-attempt-failed"),
    sceneStoryboard: describeSceneStoryboardFromBackend({
      status: "ready",
      shot_count: 1,
      enabled: true,
      image_url: STORYBOARD_IMAGE_URL,
      version_count: 3,
      last_attempt_failed: true
    })
  },
  {
    title: "Storyboard switched off for video",
    note: "Scene storyboard backend. Kept, but never sent to a video render.",
    shot: buildScene("storyboard-switched-off"),
    sceneStoryboard: describeSceneStoryboardFromBackend({
      status: "ready",
      shot_count: 1,
      enabled: false,
      image_url: STORYBOARD_IMAGE_URL,
      version_count: 1,
      last_attempt_failed: false
    })
  },
  {
    title: "Storyboard ready",
    shot: buildScene("storyboard-ready"),
    storyboard: FINISHED_STORYBOARD
  },
  {
    title: "Storyboard render failed",
    note: "Error badge where the storyboard goes, and a notice under the card.",
    shot: buildScene("storyboard-failed"),
    storyboard: FAILED_ONLY_STORYBOARD
  },
  {
    title: "Newer storyboard failed",
    note: "The previous storyboard stays; the notice says the new one failed.",
    shot: buildScene("storyboard-failed-after-finished"),
    storyboard: {
      ...FAILED_ONLY_STORYBOARD,
      latestFinishedStoryboardImageUrl: STORYBOARD_IMAGE_URL
    }
  },
  {
    title: "Storyboard can't be generated",
    note: "The project has no assets timeline yet. Generate storyboard is disabled with no explanation.",
    isGap: true,
    shot: buildScene("storyboard-unavailable"),
    canGenerateStoryboard: false
  },
  {
    title: "Scene length out of range",
    note: "The rows add up to 2 s; the error shows on both tabs.",
    shot: buildScene("storyboard-too-short", {
      video_prompt: "[Shot 1] (0-2s) The hero blinks.",
      duration_s: 2
    })
  },
  {
    title: "Locked scene",
    note: "Locked on the Storyboard tab too. Only the lock button stays pressable.",
    shot: buildScene("storyboard-approved", { locked: true }),
    storyboard: FINISHED_STORYBOARD,
    cutShot: buildCutShot("storyboard-approved", [
      buildVersion("storyboard-approved-version", LANDSCAPE_OUTPUT_SIZE)
    ])
  },
  {
    title: "Hidden scene",
    shot: buildScene("storyboard-hidden", { hidden: true }),
    storyboard: FINISHED_STORYBOARD
  },
  {
    title: "Scene from an earlier script",
    note: "No hide button. Still editable, which may not be intended.",
    isGap: true,
    shot: buildScene("storyboard-dropped", { dropped: true }),
    storyboard: FINISHED_STORYBOARD
  },
  {
    title: "Saving a change",
    note: "Title becomes read-only; the shot table stays editable.",
    shot: buildScene("storyboard-busy"),
    storyboard: FINISHED_STORYBOARD,
    isBusy: true
  }
];

const SEVERAL_VERSIONS = buildVersionsNewestFirst(
  "several",
  6,
  LANDSCAPE_OUTPUT_SIZE
);

const LOCKED_SCENE_WITH_CHANGED_PROMPT: SceneCardExample = {
  title: "Locked scene",
  note: "Lock saved on the server. Versions hidden, inputs disabled, all but the video dimmed. The prompt changed, but no notice shows.",
  shot: buildScene("video-approved", { locked: true }),
  cutShot: buildCutShot("video-approved", [
    buildVersion("approved", LANDSCAPE_OUTPUT_SIZE),
    buildVersion("approved-older", LANDSCAPE_OUTPUT_SIZE, {
      created_at: "2026-10-20T10:00:00Z"
    })
  ]),
  changedPaths: ["video_prompt"]
};

const LOCKED_VS_UNLOCKED_EXAMPLES: SceneCardExample[] = [
  {
    ...LOCKED_SCENE_WITH_CHANGED_PROMPT,
    title: "Left: locked scene with a changed prompt",
    note: "No notice shows under it."
  },
  {
    title: "Right: the same scene unlocked",
    note: "Editable again: versions, Generate and the Will re-render warning are back.",
    shot: buildScene("video-unlocked"),
    cutShot: buildCutShot("video-unlocked", [
      buildVersion("unlocked", LANDSCAPE_OUTPUT_SIZE),
      buildVersion("unlocked-older", LANDSCAPE_OUTPUT_SIZE, {
        created_at: "2026-10-20T10:00:00Z"
      })
    ]),
    changedPaths: ["video_prompt"]
  }
];

const SCENES_TAB_EXAMPLES: SceneCardExample[] = [
  {
    title: "Never rendered",
    shot: buildScene("video-never")
  },
  {
    title: "First render in progress",
    shot: buildScene("video-first-render"),
    isRendering: true
  },
  {
    title: "One version",
    note: "The pinned video takes the full width; no version grid.",
    shot: buildScene("video-single"),
    cutShot: buildCutShot("video-single", [
      buildVersion("single", LANDSCAPE_OUTPUT_SIZE)
    ]),
    hasShotChangedSinceRender: false
  },
  {
    title: "Several versions",
    note: "Newest is unseen (New). Ratings pass, fail and pending. Show all versions appears past four.",
    shot: buildScene("video-several"),
    cutShot: buildCutShot("video-several", SEVERAL_VERSIONS, "several-4"),
    hasShotChangedSinceRender: false
  },
  {
    title: "New version rendering",
    shot: buildScene("video-rerender"),
    cutShot: buildCutShot("video-rerender", SEVERAL_VERSIONS.slice(0, 2)),
    isRendering: true
  },
  {
    title: "Render failed",
    shot: buildScene("video-failed"),
    cutShot: buildCutShot("video-failed", [
      buildVersion("failed", LANDSCAPE_OUTPUT_SIZE, {
        ready: false,
        status: "error"
      })
    ])
  },
  {
    title: "Changed since the last render",
    note: "Prompt, render speed and visual style changed.",
    shot: buildScene("video-changed"),
    cutShot: buildCutShot("video-changed", [
      buildVersion("changed", LANDSCAPE_OUTPUT_SIZE)
    ]),
    changedPaths: ["video_prompt", "settings.engine", "settings.visual_style"]
  },
  {
    title: "Blocked: an entity has no pinned image",
    shot: buildScene("video-blocked-entity", {
      tags: { characters: ["hero", "villain"], environments: [], props: [] },
      missing_references: [{ token: "villain", reason: "no image" }]
    })
  },
  {
    title: "Blocked: no reference image at all",
    shot: buildScene("video-blocked-no-reference", {
      tags: { characters: [], environments: [], props: [] },
      references: {}
    }),
    isShotBlockedForNoReferenceImage: true
  },
  {
    title: "Sequential: blocked",
    shot: buildScene("video-sequential-blocked"),
    sequentialBlockedLabelKey:
      "script_project.shot_blocked_sequential_no_predecessor_render.label"
  },
  {
    title: "Sequential: reference ignored",
    shot: buildScene("video-sequential-ignored"),
    isSequentialReferenceIgnored: true
  },
  {
    title: "Storyboard attached as a reference",
    shot: buildScene("video-with-storyboard", {
      tags: {
        characters: ["hero"],
        environments: [],
        props: ["storyboard_video_with_storyboard"]
      }
    }),
    storyboard: FINISHED_STORYBOARD
  },
  LOCKED_SCENE_WITH_CHANGED_PROMPT,
  {
    title: "Nothing to generate",
    note: "No changes since the last render: Generate is disabled, with a note under it.",
    shot: buildScene("video-up-to-date"),
    cutShot: buildCutShot("video-up-to-date", [
      buildVersion("up-to-date", LANDSCAPE_OUTPUT_SIZE)
    ]),
    hasShotChangedSinceRender: false
  }
];

const PORTRAIT_EXAMPLES: SceneCardExample[] = [
  {
    title: "Vertical, several versions",
    note: "At most three tiles under the video.",
    shot: buildScene("portrait-several"),
    cutShot: buildCutShot(
      "portrait-several",
      buildVersionsNewestFirst("portrait", 5, PORTRAIT_OUTPUT_SIZE)
    ),
    outputSize: PORTRAIT_OUTPUT_SIZE,
    hasShotChangedSinceRender: false
  },
  {
    title: "Vertical, one version",
    shot: buildScene("portrait-single"),
    cutShot: buildCutShot("portrait-single", [
      buildVersion("portrait-single", PORTRAIT_OUTPUT_SIZE)
    ]),
    outputSize: PORTRAIT_OUTPUT_SIZE,
    hasShotChangedSinceRender: false
  }
];

const LIST_EXAMPLES: SceneCardExample[] = [
  {
    title: "List layout, several versions",
    shot: buildScene("list-several"),
    cutShot: buildCutShot(
      "list-several",
      buildVersionsNewestFirst("list", 3, LANDSCAPE_OUTPUT_SIZE)
    ),
    storyboard: FINISHED_STORYBOARD,
    hasShotChangedSinceRender: false
  }
];

const ToolbarGenerateStates = () => (
  <div className="flex flex-col gap-6 p-8">
    <p className="font-lato text-xl font-semibold text-glyph-primary">
      Toolbar Generate (Assets, Storyboard and Scenes tabs)
    </p>
    {[
      { title: "Something to generate", countLabel: "(10)", credits: 8200 },
      {
        title: "Nothing to generate (Assets, Scenes)",
        countLabel: "(0)",
        credits: 0,
        isDisabled: true,
        nothingToGenerateReason: "No changes since the last generation"
      },
      {
        title: "Nothing to generate (Storyboard)",
        countLabel: "(0)",
        credits: 0,
        isDisabled: true,
        nothingToGenerateReason: "No scene is waiting for a storyboard"
      },
      {
        title: "Price reloading",
        countLabel: "(10)",
        credits: 8200,
        isPriceLoading: true
      },
      {
        title: "Run starting",
        countLabel: "(10)",
        credits: 8200,
        isPending: true
      }
    ].map((state) => (
      <div key={state.title} className="flex items-center gap-6">
        <p className="w-48 font-lato text-sm text-glyph-secondary">
          {state.title}
        </p>
        <NothingToGenerateReason
          reason={state.nothingToGenerateReason}
          isPending={state.isPending ?? false}
          isPriceLoading={state.isPriceLoading ?? false}
          testId={`toolbar-generate-${state.title}`}
        />
        <GenerateRunButton
          label="Generate"
          countLabel={state.countLabel}
          cost={{ kind: "credits", amount: state.credits }}
          isDisabled={state.isDisabled ?? false}
          isPending={state.isPending ?? false}
          isPriceLoading={state.isPriceLoading ?? false}
          onPress={doNothing}
          testId={`toolbar-generate-${state.title}`}
        />
      </div>
    ))}
  </div>
);

const meta: Meta = {
  title: "Script project/Scene card states",
  parameters: { layout: "fullscreen" }
};

export default meta;

type Story = StoryObj;

export const StoryboardTab: Story = {
  render: () => (
    <ScrollablePage>
      <StatesGallery
        heading="Storyboard tab: scene card"
        examples={STORYBOARD_TAB_EXAMPLES}
        scenesView="storyboard"
      />
    </ScrollablePage>
  )
};

export const ScenesTab: Story = {
  render: () => (
    <ScrollablePage>
      <StatesGallery
        heading="Scenes tab: scene card"
        examples={SCENES_TAB_EXAMPLES}
        scenesView="video"
      />
    </ScrollablePage>
  )
};

export const LockedVsUnlocked: Story = {
  render: () => (
    <ScrollablePage>
      <StatesGallery
        heading="Locked vs unlocked"
        examples={LOCKED_VS_UNLOCKED_EXAMPLES}
        scenesView="video"
      />
    </ScrollablePage>
  )
};

export const VerticalProject: Story = {
  render: () => (
    <ScrollablePage>
      <StatesGallery
        heading="Scenes tab: vertical project"
        examples={PORTRAIT_EXAMPLES}
        scenesView="video"
      />
    </ScrollablePage>
  )
};

export const ListLayout: Story = {
  render: () => (
    <ScrollablePage>
      <StatesGallery
        heading="List layout: Storyboard tab"
        examples={LIST_EXAMPLES}
        scenesView="storyboard"
        scenesLayout="list"
      />
      <StatesGallery
        heading="List layout: Scenes tab"
        examples={LIST_EXAMPLES}
        scenesView="video"
        scenesLayout="list"
      />
    </ScrollablePage>
  )
};

export const ToolbarGenerate: Story = {
  render: () => (
    <ScrollablePage>
      <ToolbarGenerateStates />
    </ScrollablePage>
  )
};
