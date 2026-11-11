# Domain Context — Mago Frontend

AI-powered video editing platform. Users upload source videos, define frame ranges, select AI video models, and generate rendered outputs.

---

## Glossary

### Project

Root container owned by a user. Contains multiple **Shots** organised into optional folders. Users hit quota limits at the project level.

A project exists only as long as it has at least one Shot. When the user deletes the last Shot (individually or via bulk delete), the project is deleted too. This may change later if projects ever hold parameters/assets that are independent of Shots.

> **API mismatch**: The backend calls this a "Project" containing "Timelines". On the frontend we use Project → Shots. See [Shot](#shot).

### Project Update Contract (settings merge)

`PUT /projects/:id` replaces `name` and `description`, and merges `settings`. An **omitted `settings` leaves the stored settings untouched**. A sent `settings` replaces the stored one, except for the backend-owned keys (`type`, `pinnedTrackIds`, `mirroredLocalProjectId`), which are kept when the request leaves them out, and `script_flow`, which is never taken from the request (`merge_internal_settings` in the backend). Every other key a request leaves out — `rangeMin`, `rangeMax`, `folders`, `shotFolders` — is dropped, so **a caller of `useUpdateProject` that sends `settings` must send all of them** (spread `...current.settings` when patching one key). Mago Studio's library follows the same rules: `updateProject` sends the stored settings when the caller omits them, and the desktop `ProjectRepository.update` keeps the same backend-owned keys (`mergeBackendOwnedProjectSettings`). `useUpdateProject.onSuccess` also keeps `oldProject.settings` when `variables.settings` is undefined, so the cache is never clobbered by an omitting caller.

### Cloud Mirror Project

The hidden cloud project a cloud render from a **local** project runs in. Mago Studio creates it on the first cloud render (`ensureCloudProject` in `src/domains/cloud/mirrorService.ts`) and links it in the library's `cloud_links` table. There is at most one per local project: concurrent renders share one creation. A linked mirror (or one of its timelines) that the cloud no longer has is replaced on the next render; the check runs once per app run, and never for a real cloud project's own links (`origin: "cloud"`).

It is not a usable cloud project, so it must never appear on a dashboard. Never hide one with `active=false`: that is the delete flag, and sheet renders and shot generation reject inactive projects.

### Automatic Project Naming

New projects start with the default name `Untitled` (or `Untitled_NN` when taken — `generateUntitledName`). On the **first** video uploaded into a project whose name is still that default **and** which has no video yet, the project is auto-renamed to the first 10 characters of the video's filename with the extension stripped (`AUTO_PROJECT_NAME_LENGTH`), e.g. This keeps project names distinctive and discourages a "one project = one video" mental model. The decision is a pure function (`resolveAutoProjectName`); the shared `useAutoNameProjectFromVideo` hook applies it across both upload hooks (single-video `useCreateProjectAndUploadVideo` and multi-file `useBulkUpload` — first file), renaming via `useUpdateProject` in a non-blocking try/catch. It never overrides a user-chosen name, never re-triggers once the project has content, sets the name as-is (no de-duplication), and is **skipped during onboarding** (`useIsOnboardingActive`) so onboarding's `Onboarding`/`Onboarding_N` resume-by-name is preserved.

### Shot

A single editable video segment within a project. Contains a source video (**Image Track**) and zero or more **Render Tracks**. Displayed as one entry in the shots panel and one row in the project timeline.

> **API mismatch**: The backend calls this a "Timeline". The frontend always uses "Shot".

The code, the API and this glossary still say Shot; only the `script_project` copy in `i18n.ts` changed. The Agent's master prompt and the `Shot N:` labels it writes into the script text are untouched.

### Shot render speed (Slow / Fast rendering)

On a Script project's Shots tab, a per-project switch labelled "Slow rendering" / "Fast
rendering" chooses which engine every Shot renders on. Slow sends `engine: "v9.1.0"` — Mago's own
render engine, running on Mago's servers. Fast sends `engine: "minimax_h3_max"` — the MiniMax H3
Max engine, hosted on fal.ai. The choice is stored on the project as `settings.shot_engine` and
applies to the whole project, not per Shot; it is unrelated to the Video generation step's
per-Track [Render Settings](#render-settings-canonical-read-path), which pick an editor model for
a single render rather than an engine for every Shot in a Script project.

### VFX mode

A setting on MiniMax H3 (Local) that loads one community LoRA, turning the render into a specific edit of the source video: VFX edit, Head swap, Character swap or Style transfer. `none` renders a plain reference render. Each mode fixes its LoRA file, its prompt trigger, whether the source video is a **guide** (pinned frame for frame to the output through `MiniMaxH3AddGuide`) or a **reference** (`<Video 1>`), and whether a reference image is required. The mode table lives in `desktop/shared/minimaxH3VfxModes.ts`, shared by the settings panel and the ComfyUI graph builder. Sharpen is not a mode, and crossview is parked on its own branch.

### Shot lock (locked scene)

A Script project Shot's `locked` flag, saved on the backend and toggled from the lock button in
the scene card header (`PATCH …/shots/{timeline_id}` with `locked`). It is how a user approves a
scene: Generate skips a locked Shot, its pinned version never moves on its own, and the lock
survives a re-cast. The backend still accepts content edits on a locked Shot, so the scene card
disables them itself and hides the versions and notices. A locked Shot is also left out of the
Storyboard tab's batch Generate.

### Track

A layer attached to a Shot. Two kinds:

- **Image Track** — the source video uploaded by the user (always present, one per Shot)
- **Render Track** — an AI-generated video output (zero or more per Shot). A Render Track can be **pinned**.

> **API mismatch**: The backend calls these "Layers". The frontend always uses "Track".

### Image to Video (i2v)

The prototype tool that animates a still image into a video clip, reached from the Global Timeline's **+ Add** cell via **Generate with AI**. Backed by the `seedance_2_i2v` and `seedance_2_i2v_fast` engines — the only video models that take **no source video**, so their backend `sources` payload is `{}`. Lives entirely in a modal; it is deliberately separate from the normal per-shot editing flow.

### Container Shot

The single hidden Shot per project that holds every Image to Video render, referenced by `project.settings.betaI2vShotId`. It has no Image Track, so it is not a usable Shot in the normal editor — it exists only to give i2v renders a `parent_layer_id`. It is excluded from the shots panel, and nothing may navigate to it or surface its name.

> Only one exists per project. A Container Shot that does not end up referenced by `betaI2vShotId` is deleted rather than left behind.

### Generation

An Image to Video render, as presented in the modal's right-hand column. The same entity as a **Render Track** — "Generation" is the user-facing word inside the i2v modal only; everywhere else use **Render Track**.

### Input Track

The track that AI operations on the current Shot (renders, masking, modify-frame) consume as their source video. Resolved from `inputTrackIdAtom`. Defaults to the Image Track; switches to a finished Render Track when the user invokes [Iterate](#iterate). The Mask tab is scoped end-to-end to the Input Track — viewport, track-list input row, and visible mask renders all key off it.

### Iterate

User action that promotes a finished Render Track to become the current Input Track (`inputTrackIdAtom`) so further renders, masking, or modify-frame operations use that render as their source instead of the Image Track. Triggered by the **"Edit this video"** button (icon `edit-video`) on a finished Render Track row in the per-shot timeline. Disabled for tracks that are not `FINISHED`.

### Render Settings (canonical read path)

The backend echoes a Render Track's settings into four places in `/project/:id`:

- `layer.data.renderSettings.magov2` (camelCase, set by FE at layer-create with defaults; never re-synced)
- `layer.clips[0].data.render_settings.magov2` (snake_case, written by `submit_render_job`)
- `layer.clips[0].asset.data.data.render_settings.magov2` (snake_case, written by `submit_render_job`)
- `layer.clips[0].asset.data.renderSettings.magov2` (camelCase, not written by `submit_render_job` — empty for renders)

**Invariant**: the FE reads render settings only through `getTrackRenderSettings(track)` (`src/domains/track/utils/getTrackRenderSettings.ts`), which returns `layer.clips[0].asset.data.data.render_settings.magov2`. No other read path is permitted — the other three copies are either stale (layer-level defaults) or unwritten (asset-level camelCase).

### Settings Panel Hierarchy (main / technical / Quality / Advanced)

Each video model's settings are declared as `VideoModelDefinition.settingsGroups: SettingsGroup[]` (`src/app/models/shared/types.ts`), replacing the former `tabs` field. A `SettingsGroup` keeps the same shape as the old tab (`name`, `sections`, `hidingCondition`) plus a required `level: "main" | "technical" | "quality" | "advanced"`. The settings panel (`SettingsEditor`) stacks every model's groups by level rather than switching between tabs:

- **main** — the model's primary creative controls, always visible, no heading.
- **technical** — always visible, under a "Technical settings" heading.
- **quality** — collapsed behind a "Quality settings" accordion, default closed.
- **advanced** — collapsed behind an "Advanced settings" accordion, default closed.

`src/app/models/video/utils/settingsGroupsByLevel.ts` buckets a model's groups per level (filtering group-level `hidingCondition`); `flattenSettingsGroups.ts` is the single `settingsGroups → sections → settings` traversal used by every mechanical consumer (default-value extraction, validation schema, copy/paste, etc.). A section's `name` is retained as data only — it no longer renders as a heading or divider — but its `hidingCondition` still gates all of its settings as one unit.

**Three distinct tab-like constructs exist in this codebase; only one was removed by the settings-organization change:**

1. The former Basic/Advanced (+ model-specific `Controlnets`/`Loras`) switcher inside the settings panel — **removed**, replaced by the level hierarchy above.
2. The project-mode tab bar (Render video / Modify frame / Mask / Upscale, the `tool` URL param, `ProjectModeSelector`) — **unaffected**, a separate concern.
3. `trackSettingsSelectedTabAtom` — pre-existing dead state (write-only, no readers), left in place, tracked separately from this change.

**Invariant**: `isAlwaysVisibleSetting` / `getAlwaysVisibleSettingKeys` (`src/store/utils/isAlwaysVisibleSetting.ts`) define "always visible" as levels `main` + `technical` combined — this is what `renderSettingsStore.ts` uses to decide whether changing a setting invalidates the currently-selected preset, and which values survive a preset switch. A setting promoted into `main` or `technical` by a model's curated ordering therefore stops invalidating presets on change, even if it previously lived outside the old Basic tab (e.g. Creative upscaler's Steps/Detail enhancement, and Mago Transform's controlnet-selection settings).

### Pinned Track

A Render Track marked as active. When pinned, it is shown in the Project Timeline in place of the source video. Only one track per Shot can be pinned at a time.

**Invariant**: Only a `FINISHED` Render Track may be pinned. The pin control is disabled for tracks that are not finished (queued, in-progress, errored, cancelled). This guarantees every pinned track has a downloadable video asset — relied upon by the Project Timeline download actions (see [Global Timeline Download](#global-timeline-download)).

### Project Timeline

The full sequence of all Shots in a project, displayed as a horizontal timeline with a playhead, ruler, and zoom controls. Shows the pinned track (or source video if none pinned) for each Shot.

### Global Timeline Download

A bulk-export action in the Project Timeline toolbar (right of the timeline-tools row, before the zoom controls), rendered as a ghost button with a download icon:

- **Download pinned** — downloads every pinned Render Track as a single client-side ZIP (`<projectName>_pinned.zip`), one `.mp4` per Shot. Disabled when no Shot has a pin. Because of the [Pinned Track](#pinned-track) FINISHED invariant, every pinned clip is downloadable.

While the download is in progress the user is warned before leaving — the native `beforeunload` dialog for close/refresh, and a confirm dialog when switching Project Mode tabs.

### Frame Range

The subset of a source video selected for rendering, expressed as `[startFrame, endFrame]` (0-based, **inclusive**: frame count is `endFrame - startFrame + 1`). Determines render duration and cost.

### Timeline Offset

The start frame of a rendered subset within the source video. If the user renders frames 20–79 of a 100-frame video, the output has length 60 and `timelineOffset = 20`. Used to map output-relative frame indices back to source-relative positions (e.g. for masking).

### Frame Coordinates (canonical conversion module)

Every clip lives in two coordinate spaces: **source frames** (indices into the uploaded video) and **output frames** (indices into the rendered subset, from 0). The [Timeline Offset](#timeline-offset) bridges them — output frame 0 sits at source frame `offset`.

**Invariant**: all conversions between source frames, output frames, and output seconds go through the `frameCoordinates` module (`src/domains/track/utils/frameCoordinates/`) — no other code reads `clips[0].data.timeline_offset` to convert (only the producer `buildMockTrackDuringGeneration` and the schemas reference the raw field). The module owns:

- `getTimelineOffset(track)` — the offset accessor (`?? 0`).
- `toOutputFrame({ sourceFrame, offset })` — `Math.max(0, sourceFrame - offset)`. **Clamped at 0**: an output frame index can't be negative, so a source frame before the range start (reachable via the mask numeric frame input or the global playhead when the input track is an iterated render with offset > 0) maps to output frame 0.
- `toSourceFrame({ outputFrame, offset })` — `outputFrame + offset` (inverse; e.g. a mask point's absolute frame `mask_frame_idx + timeline_offset`).
- `toSeconds({ outputFrame, fps })` — `outputFrame / fps` (elapsed time in the output clip; compose with `toOutputFrame` from a source frame).
- `frameRangeOf(track)` — `[offset, offset + duration]`, the source-frame range (replaces the former `getTrackFrameRange`).

Functions take **named object params** so the conversion direction can't be swapped at the call site.

### Track Payload Accessors (canonical read seam)

**Invariant**: production code never reads a track's clip via a raw `clips[0]` / `clips?.[0]` deep path — every read goes through the pure accessor family in `src/domains/track/utils/`, and the literal `clips[0]` exists in exactly one production file (`getTrackClip.ts`). The seal is enforced by `scripts/checkRawClipAccess.mjs` in `npm run lint`; construction utils that _build_ clips arrays (e.g.

The family, each `(track: Layer | undefined) => value | undefined`, composed on `getTrackClip`:

- `getTrackClip(track)` — the track's first clip; the single raw read.
- `getTrackAsset(track)` — `clip.asset`, the track's video/render asset.
- `getTrackAssetId(track)` — `clip.asset_id`.
- `getTrackAssetData(track)` — `clip.asset.data` (duration, fps, `queue_status`, thumbnails…).
- `isTrackAssetFinished(track)` — `queue_status === AssetStatus.FINISHED`; the single owner of the finished comparison.
- `getTrackRenderSettings(track)` / `getTrackSources(track)` / `getTrackInputVideoId(track)` — pre-existing canonical reads (see [Render Settings](#render-settings-canonical-read-path)), now composed on `getTrackClip` too.

### Crop / Bounding Box

The FE never crops
pixels — it only sends coordinates; the renderer crops.

- **Normalized FE, absolute BE**: FE state (`domains/renders/utils/cropRect/`)
  stores the box **normalized** to the frame (`{x, y, width, height}`, fractions
  0–1). On submit it converts to **absolute source-video pixels** —
  `render_settings.magov2.crop_coordinates: {top_left:[x,y], bottom_right:[x,y]}`
  - `render_settings.magov2.source_video_dimensions: [W,H]`, both integers — via
    `buildRenderPayload.ts`, the same central spot that already injects
    `frame_range`/`mago_engine` for every model.
- **Crop-capable engines**: `isCropCapableEngine` (`domains/renders/utils/`) — every
  Mago-native engine (v2.x–v8.x), both upscalers, and the mask model. Broader than
  [Video Model](#video-model)'s pre-existing `isMagoEngine`, which omits V7/V8 and
  both upscalers. Kling, Seedance 2, and Happy Horse never accept a crop.
- **Storage**: shared per `(user, project, shot)`, tool-independent
  (`src/store/cropStore.ts`, key `shot-crop-${userId}-${projectId}-${shotId}`) —
  deliberately **not** the per-tool `render-settings-*` key (see
  [Render Settings](#render-settings-canonical-read-path)), so a mask crop and a
  render's requested crop can actually agree.
- **Mask / image-source match requirement**: the backend 400s if a selected mask's
  or a generated image source's stored crop disagrees with the request's crop. FE
  mirrors this before submit via `getMaskCropMismatchError.ts` /
  `getImageSourceCropMismatchError.ts`, both reading a track's stored crop through
  the [Track Payload Accessors](#track-payload-accessors-canonical-read-seam)
  family (`getTrackCropSettings`), wired into
  [Render Submission State](#render-submission-state-canonical-gate).
- **Persistence on a finished render**: the backend writes `crop_coordinates` +
  `source_video_dimensions` onto the render clip's `data` (beside
  `timeline_offset`), untouched inside `render_settings.magov2` — so reusing that
  render's settings restores the box through the existing settings read path, and
  the finished render's own crop drives its compositing display (input video
  full-frame, the render overlaid at the stored crop region) independent of the
  shot's _current_ live crop selection.
  `isShotCroppedSectionOfInputVideo`
  (`domains/renders/utils/cropRect/`) additionally requires positive area and a
  selection smaller than the full frame — whether the shot is actually a cropped
  section of its input video. They disagree in exactly one case: a stored
  full-frame or zero-area rectangle, where `isCropToolActive` is `true` but
  `isShotCroppedSectionOfInputVideo` is `false`. `isCropToolActive` gates
  presentation — the crop overlay (`CropOverlay`) and the toolbar's pressed/disabled
  state (`PreviewButtonGroup`) — because those are about the tool being on, not
  about the output. `isShotCroppedSectionOfInputVideo` gates consequence — the wire
  payload (`toCropWireFields`), output dimensions (`toCroppedOutputDimensions`),
  render validation (`getRenderValidationErrorKeys`), the Generate button's area
  label (`RenderBottom.tsx`), and the three image-to-image crop behaviours — because
  those are about what actually gets cropped. Earlier specs and code referred to
  these as an "active" crop and a "meaningful" crop selection respectively; those
  terms map onto `isCropToolActive` and `isShotCroppedSectionOfInputVideo` one for
  one.

### Video Model

An AI model that generates video. Each model has a unique ID, credit cost coefficients, supported frame ranges per subscription tier, and a visibility status. Current models include MagoV3, MagoV4, MagoV5, Seedance 2.0, Kling, GPT Image 2, Upscaler, SAM3 Mask.

> Not to be confused with `renderEngine` — see [Render Engine](#render-engine).

### Declared Model Capability

A per-model behavioural trait declared inside the `capabilities` record on the model's `VideoModelDefinition`, rather than inferred from an engine-id list held in another file. Code asking "does this engine do X?" resolves the model with `getVideoModelByEngine(engine)` and reads the declared field.

The record is mandatory on every model; one that declares nothing carries `capabilities: {}`, stating the absence rather than leaving it implied. Its keys stay optional, so key-level completeness is enforced by `modelCapabilityDeclarations.test.ts` wherever a capability's applicability can be derived from the model itself.

Declared capabilities today: `wireSourceRoles` (which source-image roles the model emits on the wire), `supportsFacemeshBlending`, and `overwritesPromptOnSelect` (selecting the model replaces the current prompt with its own default instead of preserving it). A capability is declared explicitly on every model for which it is meaningful, so a new model cannot inherit or lose it by omission.

### Render Engine

A fixed legacy field always set to `"magov2"`. It identifies the backend execution infrastructure, not the AI model. All current video models run on magov2. Never changes at runtime.

### Img2Img (Image-to-Image)

The class of AI models used in the **Modify Frame** tab. Takes a source frame + prompt + settings and outputs an edited frame. Distinct from video-to-video rendering. Examples: GPT Image 2, Nano Banana Pro, Seedream 5.0 Pro. The canonical selectable list lives in `ModelSchemaMap` (`src/app/(authenticated)/(home)/components/Navbar/Img2ImgModalV2/schemas/index.ts`); team-only gating in `ModelSelector.tsx`.

### Modify Frame

The UI tab where users apply **Img2Img** models to individual frames. "Modify Frame" is the product name; "Img2Img" is the technical model category.

### Edited Frame

The user-facing name for an **Img2Img** output — the frame the user restyled from a source frame. Surfaced as the "Edited frame" label on the onboarding render step, paired with "Input" (the source frame taken from the **Input Track**). In code the same value is `stylizedFrameSrc` / `selectedImageAssetId`.

### Masking

A workflow that produces a black-and-white mask video using the **SAM3 Mask** model. The mask isolates regions of interest (objects, backgrounds) and is fed as input to the **Inpainting** model. Masking and Inpainting are two separate pipeline stages.

A **mask render** is a Render Track whose `mago_engine` is the SAM3 Mask engine. Mask renders belong exclusively to the **Mask** tab — they are filtered out of every other Project Mode tab (Render video, Modify frame, Upscale).

### Inpainting

A video model that takes a source video + a mask video (from **Masking**) and edits only the masked region. The mask guides where edits are applied.

> **Product label**: the user-facing name is **"Mago Inpaint"** (model picker, preset card). The domain concept and all internal identifiers (`v5_1_0InpaintingRenderModel`, `applyMaskAsInpaintingInputAtom`, `InpaintingBasicInfoBlock`, `useAsInpaintingMask`, etc.) keep the term `Inpainting`.

### Drawn Mask

A red mask the user paints by hand, with a brush, directly on a **video frame** inside **Modify Frame**, to tell **Seedream 5.0 Pro** which region to edit. Entirely distinct from **Masking** (the SAM3 black-and-white mask _video_ used by **Inpainting**):

- It is a still-image mask on a single frame, not a mask track/video.
- It is **only** available when the Seedream 5.0 Pro frame source is **From Video** (it needs the frame pixels to draw on and composite into).
- It is **not** sent to the model as a separate mask input (Seedream's edit API has no mask parameter). At generate time the painted red strokes are composited onto the frame and the **single merged image** is sent as the model's main image input (`input_image`). No standalone mask asset is uploaded.
- **Availability**: the draw-mask UI is available to **all users** (`isSeedream5Pro` in `Img2ImgFrameSelector.tsx`; no team-member gate).
  GPT Image 2 still has its separate "upload a black-area mask" field (`maskImages` → `mask_image_id`), which is unrelated to the Drawn Mask.

> **Term discipline**: use **Drawn Mask** (or "draw a mask") for this feature. Reserve **Masking** / **mask render** / **mask track** for the SAM3 flow. The user-facing button is **"Create Mask"** (no mask yet) / **"Edit mask"** (on the masked frame) / **"Add mask"** (viewing a different frame). The frame a mask was painted on is the **masked frame**.

### Render Queue

The backend queue tracking in-flight render jobs. The frontend polls or subscribes (WebSocket) for status and ETA updates. Displayed in the Queue panel.

### Render Submission State (canonical gate)

The single answer to "can this render be submitted?". The single primary Generate button in `RenderBottom` derives its disabled state, disabled tooltip, and credit display exclusively from whichever target the active preset selects.

**Invariant**: no submission-gating rule is evaluated outside `domains/renders`. Environment gates (rate limit, uploading, queue, credits) block without a `disabledReason` — their messaging is carried by dedicated alert banners.

**Submit-time guard**: `useSubmitVideoRender` re-runs the payload rules (`validateRenderPayload`) against the exact submitted params before mutating, closing the drift window between button press and the confirmation toast.

### Render Status (canonical resolution order)

A Render Track's status comes from two sources that can disagree: the **live queue item** (`useQueueItemForTrack`, fresh from the queue subscription) and the **cached asset status** (`clip.asset.data.queue_status`, persisted on the asset and often stale). The canonical order is **live-first**: the live queue item's `status` wins, falling back to the cached `queue_status` only when no live item exists.

**Invariant (enforced by module shape, not convention)**: matching, resolution, and display text are all owned by the queue domain (`src/domains/queue/`).

- **Matching** — a track's live queue item is resolved by the single matcher `findMatchingQueueItem(queueItems, track)` (`src/domains/queue/utils/findMatchingQueueItem.ts`): first-clip asset id, falling back to that asset's `parent_render`. The three render-status **display** surfaces below resolve their queue item through it. (A few non-display call sites — the track-delete flow and the done/sort track utils — still match inline; the done/sort ones omit the `parent_render` fallback and are tracked as a separate consolidation follow-up.)
- **Resolution** — every surface that displays a track's render status resolves it through `useResolvedQueueStatus({ trackId, assetStatus })` (`src/domains/queue/useResolvedQueueStatus.ts`), which encodes `queueItem?.status ?? assetStatus` and also returns the resolved `statusText`.
- **Display text** — the terse status string is produced by the domain FSM `getQueueStatusText` (`src/domains/queue/utils/getQueueStatusText.ts`). The three surfaces are the **preview area** (`VideoPreview` — keeps its own richer copy but resolves status through the hook), the **track-list row** (`RenderStatus`), and the **Queue panel** (`ConnectedQueueRenderItem`, which consumes the domain FSM directly since it already holds the live item).

### Onboarding (FTUE)

The guided first-time-user flow shown to a **New User**. The dedicated `/onboarding` route owns the entry steps (sign-up questionnaire → video upload → trim). Once upload+trim creates a project, the flow hands off to the real `/project` page (with `onboarding=1`), where the remaining steps — simplified Img2Img image generation, image selection, prompt, and the final Happy Horse video render — run as onboarding overlays reusing the live editor. The early handoff exists because the Img2Img machinery is coupled to the live editor data layer.

**Resume / routing** is driven by server-side data so it works on any browser (`OnboardingFlow` on the `/onboarding` route): if the user no longer needs onboarding (completed, or **onboarding actions done** — see New User) they are sent to the dashboard (even if they land on `/onboarding`); if they have already uploaded a video (a project exists in their list) they resume on that project at the **image-generation** step, where the previously generated images load; otherwise they start from the beginning (the video upload step). The onboarding project is identified **by name** — the upload step names it `"Onboarding"` (constant `ONBOARDING_PROJECT_NAME`), appending the first free `_N` suffix if that name is already taken (a prior onboarding project, or one shared into the org). Resume matches any `Onboarding`/`Onboarding_N` project in the user's list and picks the **most-recently-updated** one. This avoids picking an unrelated project **shared into the org** (the list mixes owned + shared projects and exposes no owner flag) and works on any browser. Keeping it in memory removes the stale-state bugs a persisted projectId/step caused (e.g. pointing at a deleted project).

The leading, prod-confirmable hypothesis: a prod-only third-party script (Rewardful / GA / Product Fruits — analytics env vars are set on prod, blank on staging) rewrites the URL via `history.replaceState`/`pushState`; on the app's next forward navigation the App Router hits a tree mismatch and, on the second consecutive one, escalates to a `window.location` MPA hard-navigation (`dispatchRetryDueToTreeMismatch` — the symbol in the original trace), wiping the atom and re-triggering the redirect.

### Sign-up Questionnaire (FTUE step 1)

It is an internal multi-sub-step wizard whose sub-steps are **local component state**, not `OnboardingStep` values (`OnboardingStep` gains a single `"questionnaire"` value, now the initial step): (1) First/Last name text inputs (Email omitted — Clerk provides it), (2) "What is your line of work?" option buttons, (3) "How did you hear about Mago?" option buttons. Choice steps are **tap-to-select + auto-advance**; a Back control revisits prior sub-steps.

**Persistence** is to **Clerk** (no backend user-profile endpoint exists): a single `user.update()` at completion writes `firstName`/`lastName` to the native fields and `profession`, `referralSource`, and `signupQuestionnaireCompleted: true` to `unsafeMetadata` (following the `ReferralTracking`/`GoogleTag` precedent; payload is tiny, well under Clerk's ~1.2KB session-token guidance). **The native name write requires the Clerk instance to have the Name attribute enabled (dev + prod)** — otherwise `user.update` rejects `first_name`/`last_name` (`form_param_unknown`) and, since it's one atomic call, the entire save fails (error toast, nothing persisted). The completion flag is read from the **client** `useUser()` (`useIsSignupQuestionnaireCompleted`), so a returning user with the flag set **skips** the questionnaire and resumes at the video-upload step without waiting for a session-token refresh — the main new-user gate stays on `balance.onboarding.completed`, independent of Clerk metadata. Answers are not persisted until the final submit, so a hard reload mid-questionnaire re-asks (same in-memory-progress limitation the rest of the flow has). Existing/already-onboarded users are **not** back-filled — only New Users flowing through onboarding are prompted. "Other" (line of work) is a plain option with no free-text; no analytics event is emitted (data lives in Clerk).

### Video Tutorial Modal

The final onboarding step, shown on `/project` after the Happy Horse render is submitted and before the user can use the project page. It embeds a single YouTube tutorial and is the **only dismissable onboarding modal**: it stays blocking (no cross, no outside-click) until the user clicks Play to start the video at least once, after which the cross and outside-click become active. Dismissing it sets onboarding `step: "complete"` and reveals the normal project page on the Render video tab.

> **Term discipline**: "Onboarding" is the canonical term. The design file and analytics use "FTUE"; the legacy `data-onboarding-id="pf-*"` DOM attributes are anchors for an external product-tour tool and are unrelated to this flow.

### New User

The queue endpoint lists video renders only, so an img2img generation can never count as actions done. The backend reports `completed` correctly for existing users too (a long-standing account that has rendered video has `completed === true`), so no client-side `total_renders` check is needed. A post-login redirect guard sends a New User (`completed === false`) to `/onboarding`; the in-memory local onboarding step never gates this decision (it only prevents redirecting someone already inside the flow), so a stale step can't suppress the redirect.

### Onboarding Render Bypass

During Onboarding, image (GPT Image 2) and video (Happy Horse 1.0) generations must be **free** and must work even though both models are normally blocked in relaxed/unlimited mode. The FE bypasses the credit-balance and relaxed-mode disable logic on the generate buttons while in onboarding; the backend is assumed to handle the free/zero-charge accounting.

### Credit

The usage-based billing unit. Each render costs credits calculated from model coefficients × frame count × resolution. Credits are tied to a subscription plan or purchased separately.

### Subscription Plan

A pricing tier (Basic, Pro, Studio) that determines monthly credit allowance, per-model frame-range caps (relaxed mode), and access to team-only features.

### Subscription State

A subscription has both a **Stripe status** (`active`, `canceled`, `past_due`, `incomplete_expired`) and a derived **lifecycle flag** based on `current_period_end`. They are independent and must not be conflated:

- **Active** — Stripe `status = active`. Sub is paid and live.
- **Cancelled** — Stripe `status = canceled`. User asked to cancel; the sub continues until `current_period_end`, then becomes Expired.
- **Past Due** — Stripe `status = past_due`. Renewal payment failed; Stripe will retry. Sub is still considered to grant access until the period ends.
- **Incomplete Expired** — Stripe `status = incomplete_expired`. The initial payment never succeeded; the sub never lived. Treated as if no sub exists.
- **Expired** — derived flag (`current_period_end <= now`). Orthogonal to status: a Cancelled or Past Due sub becomes Expired once its paid period ends. An Expired sub is dead — it cannot be mutated (no upgrade/downgrade); the user must start a new Stripe Checkout to resubscribe.

### Render Mode (Credit Mode vs Unlimited/Relaxed Mode)

Every render is submitted in one of two mutually-exclusive modes, chosen by the navbar toggle (`useIsUnlimitedModeActive`, localStorage `isUnlimitedModeEnabled`):

- **Credit Mode** (toggle OFF) — the default. No usage limit, all publicly-available models, and each render **consumes visible credits** (the `balance.amount` shown in the navbar coin).
- **Unlimited / Relaxed Mode** (toggle ON) — renders against a **hidden, rate-limited credit pool** with a daily and weekly max usage instead of spending visible credits, and only a **subset of models** is allowed. Same concept regardless of label; only the **name shown to the user differs by plan**, driven off `features.relaxed_mode_type`:
  - `"unlimited"` (Studio plan) → toggle labelled **"Unlimited"**
  - `"relaxed"` (Pro plan) → toggle labelled **"Relaxed"**
  - `null` → no mode available; the toggle is hidden.

> **Naming discipline**: "Unlimited mode" and "Relaxed mode" are the **same FE concept** — the rate-limited, model-restricted, no-visible-credit render mode. The internal FE name is **Unlimited** (`useIsUnlimitedModeActive`, `isUnlimitedModeEnabled`); the API/backend names everything `relaxed_*` (`relaxed_mode_type`, `relaxed_allowed_models`, `relaxed_usage`). The user-facing label is the only thing that varies by plan.

> **API mismatch**: `relaxed_mode_type` / `relaxed_allowed_models` / `relaxed_usage` live under `features` on each subscription price (`/prices`) and on `/balance`. The backend also has `relaxed_daily_limit` / `relaxed_weekly_limit`, but these are **stripped from both endpoints — the FE never sees the absolute caps**, only `relaxed_usage.{day,week}_used_pct` (0–100) and `{day,week}_reset_at` (Unix UTC). `relaxed_usage` is `null` when the plan is uncapped.

### Allowed Models (Unlimited/Relaxed Mode)

`features.relaxed_allowed_models` is the per-plan whitelist of models usable in Unlimited/Relaxed mode. `null` = all models allowed (Studio). When non-null it is a **dual-namespace** list mixing video engine categories (`"mago_video"`, `"kling"`, `"seedance"`, `"happy_horse"`) and img2img model names (`"gpt_image_2"`, `"nanobanana_pro"`). `"mago_video"` unlocks Mago video engines but **NOT** native Mago img2img models. In Credit Mode all publicly-available models are allowed regardless of this list.

### Relaxed/Unlimited Model Badge

A pill rendered on model rows in the model selectors (video render-settings `TwoLevelsDropdown` and the img2img model picker) marking that the model is usable in relaxed mode. Two independent gates decide whether a row shows it:

1. **Eligibility (which rows _can_ be badged)** — **static, hardcoded per-model flags**: `VideoModelDefinition.modeAvailability.relaxed` for video (absent = eligible), the img2img adapter's `availableInRelaxedMode` for img2img — **not** the live `relaxed_allowed_models` whitelist.
2. **Plan (who _sees_ it)** — the badge renders **only** for Pro (`relaxed_mode_type === "relaxed"`), always reading "Relaxed" (`titles.relaxed_mode.label`). The word "Unlimited" never appears on the badge; `titles.unlimited_mode.label` is retained only for the navbar mode toggle. This gate lives in `useRelaxedBadgeLabel` (returns `undefined` for non-Pro), which both selectors collapse to "no badge" via their existing `eligible ? label : undefined`.

### Render Estimate

A frontend-computed preview of render time and credit cost shown before the user starts a render. Calculated using per-model coefficients (scale, size, frame, steps exponents) derived from production data. Intentionally computed client-side to avoid a round-trip on every slider change.

### Feature Flag / Model Status

Controls visibility of a model or feature (`VideoModelDefinition["status"]` in `src/app/models/video/types.ts`):

- `"active"` — visible to all users
- `"team_only"` — visible only to `@mago.studio` email addresses
- `"deprecated"` — legacy model, no longer offered for new renders
- `"hidden"` — removed from UI (backend still accepts it)

There is no external feature-flag service. Model visibility is determined by email domain — but not all gating is email-based: **project sharing** gates on the user having a `group_id` (`useCanShareProjects`).

> **"Feature flag" convention (settings):** when a ticket asks for a render setting to ship "under a feature flag" (e.g. a `(FF)`-suffixed label), the canonical mechanism is `hidingCondition: (_settings, isTeamMember) => !isTeamMember` — i.e. **feature flag ≡ `isTeamMember`** (`@mago.studio` emails only).

Existing gating is unchanged.

### Preset

A curated render configuration (e.g. Style Transfer, Inpainting) with example before/after images, linked to a specific model and default settings. Shown as a starting point in the settings panel.

### ControlNet

An additional input channel for video models (e.g. depth map, pose, face mesh) that guides the AI generation. Users can enable/disable ControlNet types per render.

### Video Ingest (canonical upload sequence)

The ordered sequence that turns an uploaded file into a playable source video on an **existing Shot**: create video asset → upload trim metadata (when trimmed) → resolve the created Image Track and its asset id → PUT the video to S3 → cache it locally → publish the ingestion job → poll the asset until `status === "ingested"` → invalidate the project, timeline-list, homepage and project-list caches.

**Invariant**: this sequence lives in exactly one module, `ingestVideo` (`src/domains/videoUpload/ingestVideo.ts`), consumed through `useIngestVideo`. No flow re-implements it.

The seam is **an existing `shotId`**. The module never decides how the Shot or Project came to exist, so three concerns stay with the caller, because they genuinely differ per flow:

- **Provenance** — select an existing Shot, create a Project, reuse an empty timeline, or loop per file.
- **Rollback** — delete the created Project, delete the created timeline (never a _reused_ one), or do nothing.
- **Analytics** — each flow passes different arguments to `trackingUtils.videoActions.upload`. The module fires `onUploaded` at the fixed point between the S3 transfer and the ingestion job so event timing is identical across flows.

Progress is reported as `{ phase, progress }` — `phase` exists because Bulk Upload renders a per-file status label, not just a bar. The percentage is linear 0–25% during transfer, eased 25→99% while ingesting, then 100%.

### Bulk Upload

A multi-file drag-and-drop flow that creates multiple Shots at once from video files dropped onto the shots panel.

### Shots Panel Multi-Select

A selection mode in the Shots Panel where the user holds Ctrl (Win/Linux) or Cmd (Mac) and clicks Shots or Folders to add/remove them from a selection set. Any unmodified click clears the selection. Selected items render with a blue outline. Two bulk actions are available on a non-empty selection: drag-and-drop the whole set into a target Folder, and delete via a toolbar trash button (toast-confirmed).

On the FE these are always **Shots** (and **Folders**). The product surface is the Shots Panel — there is no separate "project panel".

### Scene Timeline

The quick navigation bar above the Shot strip on the Script Project Shots tab. It has one card per Shot, and pressing a card scrolls the strip to that Shot. It is shown while the tab lists at least one Shot, unless the user turns it off with the "Scene timeline" switch on the General tab of Local settings (on by default, saved per install). The UI label is "Scene timeline"; the code keeps the older name (`SequenceTimeline`, `script_project.sequence_timeline`).

### Portal Session

A short-lived Stripe Billing customer portal URL generated on demand (click-triggered mutation). Not cached across sessions due to short TTL. Used to let users manage their subscription.

### Playhead

The vertical cursor on the Project Timeline indicating the current playback position. Draggable and click-to-seek via the ruler.

### Sources (Source Images)

The list of image inputs attached to a render. On the FE, `sources` is a uniform list of `{ asset_id, type, index? }` entries. `type` is one of `reference_frame`, `key_frame`, `element_reference`, `element_frontal`, `motion_reference`, `style_reference`. `index` is the output frame index for `key_frame` and the element-group ordinal for the `element_*` roles. Lives as a top-level field on the render form, beside `renderSettings`.

> **API mismatch**: `shapeSourcesForBackend` dispatches into four shapes, in this order — image-to-video engines (Seedance 2.0 i2v and i2v Fast) send **no** sources blob at all; Mago engines send `sources.images` with the per-engine `type` mapping below; models that own their image inputs (`VideoModelDefinition.formatSourcesForBackend` is defined — Kling O1, Kling O3 Edit Pro, Kling 2.6 / 3.0 Motion Control, Seedance 2.0, Happy Horse 1.0) send their derived typed entries as `sources.images`; every remaining engine (`v1.0.0.mask`, the upscalers, V7/V8) still sends the scalar `sources.ipadapter_image_source`. The translation lives entirely inside the `shapeRenderDataForBackend` / `parseRenderDataForFrontend` adapter pair. No other FE code references `ipadapter_image_source`.

> **Per-engine `type` mapping**: within the Mago `images[]` list, the outgoing `type` is derived per engine (not the stored `type`): v3.4.0/.lora send the single image as **both** `reference_frame` and `key_frame`; v4.0.0/v4.1.0/v5.0.0 send it as `reference_frame` only.

> **Unified wire (unify-video-model-sources-images)**: the external/API models above no longer carry their references only inside `render_settings.magov2` — they derive typed `sources.images` entries in `formatSourcesForBackend` (from the model's own form fields / the unified `sources` list) and the adapter emits them, so the backend converts each role into the payload its external render worker expects. `hasModelOwnedSources` (passed by `buildRenderPayload` from whether the model defines `formatSourcesForBackend`) is what routes them, which keeps the out-of-scope scalar engines untouched. During the transition the FE **dual-emits**: the legacy per-model keys (`image_ids`, `elements`, `image_id`, `reference_image_ids`, `ipadapter_image_source`) are still written to `render_settings` and the backend **dual-reads** (prefers `sources.images`). `parseRenderDataForFrontend` normalises both the typed list and every legacy shape back into `sources`.

`MultiImageUploader` defaults to `reference_frame`; `FileUploaderWithStylizeButton` defaults to `key_frame` (all 9 out-of-scope Mago models, unchanged) and is configured to `style_reference` for V5.0.0 and `motion_reference` for Kling 2.6 / 3.0 Motion Control via `specificConfig.role`, read by `getKeyFrameSlotRole(model)`.

### Reference Frame

An entry in `sources` with `type: "reference_frame"`. Used by AI models as a style/content reference. Order-independent.

> **Stale backend echo**: for the `image_ids` engines the FE's sole reference source of truth is `image_ids` → wire `reference_image_ids`. The backend also echoes a resolved-path field (`reference_image_paths`) back into the stored `render_settings.magov2`, which "Reuse settings" copies wholesale into the form.

A Shot's first frame the user uploads themselves for a Bulk Renders Run, instead of having one
generated from the Shot's image settings. Chosen once per draft, before the draft opens
(`BulkRenderingDraftState.firstFrameSource: "generated" | "uploaded"`), and fixed for that draft's
lifetime — no control inside the draft switches it back. A supplied-frames draft renders the Video
step alone (no Image step, no tab switch) and gains a bulk upload drop zone plus a per-Shot drop
zone in each card's first-frame tile.

On launch, a Shot with a supplied first frame is sent as a [Reference Frame](#reference-frame) in
its own `shot_overrides` entry (`{ images: [{ asset_id, type: "reference_frame" }] }`), mutually
exclusive with that Shot's `img2img_settings` — the two override shapes can never both be present,
because the backend runs `use_provided_reference_frame` in place of the image chain for that Shot.
This is the same `reference_frame` wire type Plan Create's supplied-image feature already uses;
"Supplied First Frame" is the Bulk-side name for the same concept, chosen once per draft rather
than per Shot.

### Key Frame (Source-list entry)

An entry in `sources` with `type: "key_frame"` and a numeric `index`. Tells the model which frame index in the output the image should anchor. Sorted by `index` client-side before being sent.

### Element Pair

A pair of image references — one `element_reference` + one `element_frontal` entry in `sources`, sharing `index: 0` — used by the Kling models that swap a person/animal/object into the rendered video (Kling O1, Kling 3.0 Motion Control, Kling O3 Edit Pro). Surfaced in the settings panel as the `TwoAngleImageUploader` ("Element (minimum 2 different angles…)"), and addressed from prompts via the `@Element1` tag.

- **FE storage**: two typed `sources` entries (`element_reference` / `element_frontal`, `index: 0`), written directly by `TwoAngleImageUploader`. The scalar `reference_image_id` / `frontal_image_id` form fields are **not** the stored representation.
- **FE validators / customValidation / `@Element1` prompt check**: still read `allValues.reference_image_id` / `allValues.frontal_image_id` unchanged — those are now _derived_ scalars, synthesised from the `element_reference` / `element_frontal` sources entries inside `renderSettingsValuesAtom`'s read function (the same pattern as `source_image_slot`), not stored form state.
- **BE wire / `formatValuesForBackend` output**: nested under `elements: [{ reference_image_id: string[]; frontal_image_id?: string }]`, built by `formatElementPairForBackend(sources)` directly from the `sources` list. The array shape exists only inside the adapter pair.
- `formatElementPairForFrontend` is the sole unwrap site (BE `elements` → the two `sources` entries, via `legacyImagesFromSettings`) and runs on every reuse/paste/load path.

The named type `ElementPair` (in `src/app/models/video/types.ts`) is the single source of truth for the BE shape; the three Kling adapters import it rather than redeclaring it inline.

### Viewport

The main video preview pane. Supports pan and zoom. Mouse-wheel zoom uses a 10% increment; trackpad pinch uses a 1% increment (distinguished by `ctrlKey` + `deltaMode`).

### Signup Attribution (Clerk `unsafe_metadata`)

Signup attribution the FE captures client-side and writes into Clerk `unsafe_metadata` so the backend can attach it to `user_signed_up_be` / `payment_succeeded` Amplitude events. Keys: `utm` (nested object of `utm_source`/`utm_medium`/`utm_campaign`/`utm_term`/`utm_content`, parsed from the landing URL), `country` (ISO code from Clerk's IP-geolocated session, `getSessions()[].latestActivity.country`), and `referral_id` (see below).

### Bulk Renders Run

The backend calls it a plan (`/agent/plans`, one **AgentPlan** of **AgentStep**s executed by a worker daemon); the rename happens at the domain boundary, `src/domains/bulkRendersRun/`. UI copy uses "bulk rendering" as the feature name.

Replaces the team-only **Plan** tool (`/plan` route, `src/domains/plan/`, `src/components/PlansPanel/`) — built against the same backend agent system. Bulk Renders Run is written from scratch: nothing is copied, ported, or adapted from the Plan feature's UI or its data layer (`src/schemas/plan.ts`); both features coexist behind their flags until Plan is deleted wholesale in its own task.

### Quality failure vs infrastructure failure

A **quality failure** means the render succeeded technically but never passed the quality gate. The backend retries automatically — it rewrites the prompt and re-renders, up to three times — and only then gives up. An **infrastructure failure** is anything else: the render itself errored, an upstream call failed, the step could not run.

The two are told apart by which step failed, not by an error field: a failed `img_quality_final` or `poll_img_retry` step is a quality failure, any other failed step is an infrastructure failure. Either way a failed step is terminal for its Shot — the backend never marks a step failed while a retry is still possible — so neither state is ever "maybe still trying".

### Result image (Bulk Renders Run)

The image a Shot's Image step finally produced. It is **not** simply the first render: when the quality gate retries, the retries run as separate child plans, and the parent's original render result is left untouched. The chosen image is therefore the one named by the `img_quality_final` step, falling back to the initial `poll_img2img` render when no quality gate ran, and to `use_provided_reference_frame` for a Shot whose frame the user supplied.

### Result video (Bulk Renders Run)

The video chain has no `*_quality_final` step — every render, original or retried, stays a separate visible layer/asset for the user to pick manually — so the chosen video is the one named by the latest `poll_vid_retry` step, falling back to the original `poll_video_render` when no retry ran. Read `render_asset_id` off the step result, not `asset_id` (the Image chain's field name).

### Chain-completed count vs quality-passed count (Bulk Renders Run queue panel)

A **chain-completed count** is read from a still-running run's steps: how many of its Shots have reached that chain's terminal step, regardless of whether the result was any good. It only exists while a run is in progress (In progress section), because the per-step endpoint is all that exists before the run ends.

A **quality-passed count** is read from a finished run's stored summary block (`img_passed`/`vid_passed`, only served once `is_final` is true): how many of its Shots actually passed the quality gate. It only exists for a terminal run (History section), and a run cancelled before it produced a summary has no quality-passed count at all — not zero, absent.

The two counts can look like the same UI element (a small number next to "Images"/"Videos") but they are never interchangeable: deriving one section's count from the other section's source either undercounts (quality retries can leave no failed step on the parent) or can't work at all (the summary block doesn't exist yet for a running plan).

### Video-to-video Project

A `type: "timeline"` Project (see [Project](#project)), labelled "Transform your own videos" and reached at `/project`. The user imports their own videos, each becomes a Shot, and every render transforms that source video. "v2v project" means a Video-to-video Project. The other Project type is the [Script Project](#script-project). Do not call it a "Timeline Project": [Project Timeline](#project-timeline) is a different concept.

### Script Project

A `type: "script_to_shots"` Project (see [Project](#project)), created via the "Mago Director" card (formerly "Director", before that "Script-to-movie") and reached at `/script-project`. It does not mean the obsolete `/long-form` URL. A Script Project's Shots are not authored one by one — they come from **Casting** a script, then generated per the cast's Assets and Shots.

The Agent writes its script in the standard film screenplay format: scenes, each opened by a scene heading (`INT. KITCHEN - NIGHT`), holding action, dialogue and transitions. A screenplay scene is not a Shot — Cast splits each scene into one or more Shots. The script box shows the screenplay as plain text in Courier Prime, laid out by `formatScreenplay` (character cues indented 22, dialogue 10, transitions ending at column 45); the layout is spaces in the text itself, not styling, so it is what Cast reads and what the user edits. Headings are always English (`INT.`/`EXT.` + location + `-` + time of day), because Cast splits by headings only when they match that shape. Screenplay labels (`INT.`, `CUT TO:`, `(V.O.)`) are script content, not UI chrome, so they are never translated. Scripts written before this format kept the `Shot N:` label and still show that way.

**Script Project error toast** — every error toast the Script Project raises (Script, Assets, Shots and Timeline tabs, and the run tracker) has no timer: it stays until the user presses **Retry** (repeats the failed action with the same inputs, including the call's own follow-up such as starting run tracking) or **Dismiss**, or until a newer toast replaces it. Refusals, backend validation messages and a failed run offer Dismiss only. A run the backend pauses for missing credits shows a persistent toast with **Buy credits** and Dismiss, once per run.

**Entity reference images** — up to three images on an entity (Assets tab) that its render is made from. Saved on the entity the moment they are added, together with an instruction that may be empty (the prompt itself can say what to take). Adding the first image pre-fills a default instruction the user can edit or clear. A clear instruction adds nothing to the prompt; a non-empty one is appended as "Use the supplied reference images as follows: …" — the frontend and the backend build that text identically, because the backend compares it to decide whether a render counts as the entity's current spec. Images reach the model in the order listed.

**Storyboard** — a rough black-marker sketch sheet for one Shot, with one numbered panel per row of the Shot's shot table. It is rendered img2img from a blank panel grid (plus the Shot's character references) and stored as a sheet group whose token is `storyboard_` + the Shot's timeline id. That group is kept out of the Assets tab and tagged on the Shot as a prop reference, so the video follows its composition. Removing the storyboard from a Shot (the Scenes tab's reference tile) only drops that tag: the storyboard stays on the Storyboard tab, and the video no longer follows it. The Script Project's Storyboard tab, before the Scenes tab, shows each Shot's storyboard; the Scenes tab shows its video.

That sheet-group storyboard is the fallback. A scene storyboard belongs to the Shot itself, not to the cast or its tags, so it never blocks a render. The backend draws it, keeps its versions, and sends the version in use to the video model. A storyboard is **stale** when the Shot's shot lines or cast changed since it was drawn; a stale storyboard is not sent. **Use in video** is the per-Shot switch that keeps a storyboard but stops sending it. A Shot without the `storyboard` field uses the sheet-group flow above. While a scene storyboard renders, the Shots tab also polls that render's img2img status (`GET /assets/img2img/status/<clip_id>`). The answer is not read: the call itself is what lets the backend settle a render whose webhook never arrived, since reading the project state never asks the provider.

Mago Studio implements scene storyboards in the desktop service. Each local Shot always exposes a `storyboard` summary, including when no board exists, so local generation never uses the browser grid-upload fallback. The desktop draws a numbered PNG template with at most 15 panels, renders through the existing sheet queue, and owns version selection and the Use in video switch. Pending and failed attempts remain visible; an interrupted job becomes resumable after restart. Local queued submissions have no output asset or cloud clip yet, so those ids are null until completion. State polling follows the desktop plan rather than the cloud img2img endpoint. Storyboard output never becomes the project's dashboard preview and is not auto-captioned as a cast entity.

Local projects save `settings.storyboard_render_model` separately from `settings.sheet_render_model`. Both controls share a default resolver: a signed-in local project defaults to GPT Image 2; offline it prefers an installed Qwen Image model, then an installed Flux model, falling back to Qwen for setup. A saved local choice is retained even when setup is needed; a saved cloud choice falls back while signed out. Cloud projects continue to use their backend's rendering contract. A ready, enabled, non-stale board joins composed local Shot renders after cast references and before continuity references. Its asset enters the Shot fingerprint only when used; raw prompts omit it. The composer receives the panel count, preserves composition rather than the drawing style, and stages each cut against its numbered panel.

**Visual style** — the Script Project's shared visual treatment, stored in `project.settings.visual_style` for both local and cloud projects and edited on the Assets tab through the project settings update. Casting seeds it only when the setting has never been saved; an explicit empty string or `null` keeps it cleared across re-casts. The desktop migrates a legacy `state.visual_style` once without replacing a saved setting. Casting separates style from content by default. Sheet prompts and non-composed Shot prompts append the backend's treatment-only instruction; composed Shot prompts receive `shot.style`. Style changes affect sheet and Shot fingerprints. A queued Shot uses its planned style even if the project setting changes before it renders. Storyboards do not receive the project's visual style.

**Shot table** — the per-Shot editor that replaces the prompt, dialogue and length fields: rows of duration, camera movement, framing, description and dialogue. It saves into the Shot's video prompt as `[Shot n] (start-end s) …` lines; the Shot's length is the sum of its rows. Not to be confused with a Shot itself — a Shot ("scene" in the UI) holds several shot-table rows.

**Stuck render** — a sheet image whose provider never reported back. The backend settles it when the project state is read: after 5 minutes it asks the provider, after 60 it ends the render as `timeout` and refunds it. The Assets tab keeps polling (slower after 5 minutes) while any image is unsettled, and `not_found` counts as finished.

### Sidebar

The left navigation column on every signed-in page except onboarding. Its top block lists **Home**, then the project types, as text: **Video to Video** (`type: "timeline"`) and **Mago Director** (`script_to_shots`, which creates a **Script Project**). **Generate image** and **Generate video** are Coming soon: they are not project types, are not in the Sidebar, and show only as Coming soon cards on the **Home Page**. Home opens the **Home Page**. Each project type opens `/projects?type=<type>`, the list of that type's Projects: for Video to Video, the All Projects folder tree (search, sort, folders) limited to Video to Video Projects; for the other types, a card grid with a Create project tile. Its bottom block holds the global entries that sat in the top bar before: Plans and Bulk rendering (team members), the credits row (clicking the credits opens a menu to choose Credits mode or Relaxed/Unlimited mode, and a Top up credits button), Queue, Pricing (for subscribed users) or a full-width Subscribe now button (for the rest), and the user menu ("My account"). A chevron toggle at its top collapses it to a 48px strip on any page, remembered per user; `HomeLayout` publishes its current width as `--app-sidebar-current-width`. The Sidebar owns which of its panels is open.

### Home Page

In Mago Studio the Home Page also lists **My projects** below the Tools block (without a Create project tile), and shows the **Run Mago locally** card above it until local setup is done.

The page at `/`. It is a starting point, not a project list: a **Tools** block with one card per project type (in the Sidebar's order, each opening that type's list page) plus a **Generate image** and a **Generate video** card; those two are disabled cards tagged "Coming soon", the settings tutorial card, the Discord community card, the tutorial slideshow and the news feed. Projects are listed and created on each type's list page.

### Project Bar

The slim bar above a project page (`/project`, `/project-timeline`, `/script-project`). It holds only the open Project's controls: the Shots menu and Shot name, upload, project info, Share, and the centred project name. Every global entry lives in the **Sidebar**.

### Agent

The Reels Script Assistant: a chat backend (`POST` + `GET /chat/message`) that turns anything from a one-line idea to a full pasted script into a shootable, scene-by-scene script. Its behaviour lives in this repo — the client sends the master prompt and function declarations, not the backend (`src/domains/scriptProject/utils/scriptAgentSystemInstruction.ts`, `buildScriptChatRequestBody.ts`).

**Agent conversation** — the transcript the chat column shows. The backend owns it: one per (user, Project), so it is personal, not shared with teammates on the same Project. Every user message carries the current script box text inside it, clearly framed as reference data; the chat hides that part when it renders the user's message. It answers through exactly one of two functions: `write_script`, which delivers a whole script as an ordered scene list and is the only answer that reaches the script box, or `reply`, which carries everything else (a clarifying question, an acknowledgement) and stays in the chat. This split exists because feeding the Agent's last message straight into the editor let a clarifying question silently overwrite a finished script.

### Agent script document

The structured document `write_script` delivers: an ordered list of screenplay scenes (`screenplay_scenes` — each a heading plus action, dialogue and transition elements), a continuity bible, a caption and hashtags. Documents written before the screenplay format hold `scenes` instead (each a visual generation prompt plus dialogue, on-screen text, SFX/music notes, reference tags and notes); they are still read, and shown as `Shot N:` text. Persisted on the Project as `settings.agent_script_document`, alongside the flattened text shown in the script box (`settings.agent_script`) — both survive a reload on any device because they live on the Project, not in the browser. The document's captions, hashtags, continuity bible and reference tags have no screen yet; they are stored and re-sent, never displayed.

### Cast

The verb for turning a script into a Project's entities (reference sheets) and Shots — `POST /projects/:id/script`. On the Script tab, the pipeline control Casts the text currently in the script box (the user's own edits win over the Agent's original) and always requests that the Agent decide the Shot count and length, so the tab shows only aspect ratio, resolution and image model, not a manual Shot-length or Shot-count control.

### Model group

A named set of node packs and models that Get started installs together: **Minimal** (always installed), **Local LLM**, **Qwen Image** and **Flux Image**. Defined in `desktop/shared/localModelGroups.ts`; the user picks them on the Models step, and adds more later through Update installation. Each group is installed, partial or not installed, measured against the running app's manifest: the installer records the SHA-256 of every item it installed per group (`installedModelGroups` in `settings.json`), so an app update that adds or replaces a file makes the group partial. Applies only to Get started installs; I already have ComfyUI keeps its per-file downloads and live checks.

A Model group is opaque outside its installer and its checker: a feature names the group it needs (`useIsModelGroupInstalled`, `RequiredLocalInstall`) and never what is inside it. `LOCAL_MODEL_GROUPS` is the only list; group ids and the always-installed set (`isAlwaysInstalled`) derive from it. A group may declare `hardwareVariants`, each with a minimum video memory, plus a `defaultHardwareVariantId`. The chosen variant is stored per group in `selectedModelGroupVariants` in `settings.json`; an unknown or missing choice falls back to the group default. While a group is not installed, the largest variant that fits is picked from video memory: the model-groups status measures the group at that variant, so the Models step shows the size that will be downloaded, and the installer saves it when it installs the group. An installed or partial group keeps its saved variant. `scriptTextModel` is not stored on its own: it is Local LLM's selected variant (`SCRIPT_TEXT_MODEL_GROUP_ID`), and a `scriptTextModel` saved by an older version is read as that variant and moved on the next write. Each per-file setup in `optionalScriptSetups.ts` carries a stable `OptionalScriptSetupId`; consumers match on it, never on its title.

### Model license notice

The notice that open-weight models are subject to their authors' licenses, listing every model Mago Studio can download under a non-permissive license, with a link to it. `desktop/shared/localModelLicenses.ts` holds every model; entries flagged `isPermissiveLicense` (Apache 2.0) are kept but not shown. The user accepts each license once, stored as the accepted Hugging Face repos (`acceptedModelLicenseRepos`) in `settings.json`; a non-permissive license added in a later release asks again, for itself only. Before acceptance, no model downloads: in I don't have ComfyUI installed it is the Licenses step between Storage and Download, listing only the chosen Model groups' licenses; in I already have ComfyUI it opens on a model's Download press, and closing it starts nothing.

> **`referral_id` vs `referralSource` — do not conflate.** `referral_id` is the **Rewardful affiliate id** (from the Rewardful SDK, used by the backend for Stripe `client_reference_id`). `referralSource` is the **onboarding questionnaire's "how did you hear about us"** answer (an enum like `instagram`/`youtube`). Different concepts, both live in `unsafe_metadata`.
