# Mago Studio technical reference

A one-page map of the codebase. It is written so that a contributor, or an AI assistant,
can answer most questions without scanning the whole repository. Diagrams are in
[architecture.md](architecture.md). Domain terms are defined in [CONTEXT.md](../CONTEXT.md).
When this page and the code disagree, the code wins.

## Stack

- **Shell**: Electron 43, packaged with Electron Forge (`forge.config.ts`).
- **UI**: Next.js 16 static export (`output: "export"`), React 19 with the React Compiler,
  Tailwind 4, React Aria Components, TanStack Query, Jotai, React Hook Form + Zod, i18next.
- **Storage**: `node:sqlite` through Drizzle (`desktop/main/database/`).
- **Local inference**: ComfyUI over HTTP and WebSocket. Media work uses `ffmpeg-static`
  and `mediabunny`.
- **Cloud**: Mago backend REST API, Clerk auth.
- **Tooling**: TypeScript 7, oxlint (type-aware) and oxfmt, Vitest, Playwright, Storybook.
- **License**: AGPL-3.0-only.

## Repository layout

| Path                                   | What lives there                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/`                                 | Renderer: the Mago frontend, shared with the web app.                                                                                                  |
| `src/domains/<domain>/`                | Feature domains, layered root hooks → `data/` → `api/` → `utils/`; each layer imports only from lower layers.                                          |
| `src/platform/`                        | Desktop seams: `localDesktop.ts` (`window.mago`), `identity.tsx` (Clerk or local identity), `modelProviders.ts`, `renderTarget.ts`, `cloudAccount.ts`. |
| `src/app/models/`                      | Model definitions: `video/`, `img2img/`, `preset/`, `shared/`. Local registry is `video/constants.local.ts`.                                           |
| `**/*.local.ts(x)`                     | Desktop overrides. `next.config.mjs` resolves them before the cloud twin with the same name.                                                           |
| `desktop/main/`                        | Electron main process. `application.ts` is the composition root.                                                                                       |
| `desktop/main/ipc/`                    | One `register*Handlers.ts` per namespace. Every handler checks `requireTrustedSender`.                                                                 |
| `desktop/main/database/`               | Schema, migrations, `ProjectRepository`, backups.                                                                                                      |
| `desktop/main/imageRenders/`           | `ImageRenderService` job loop and one ComfyUI client per model family.                                                                                 |
| `desktop/main/comfy/`                  | `ComfyClient`, `ComfyLauncher`, progress monitor, restart.                                                                                             |
| `desktop/main/cloud/`, `cloudStorage/` | Cloud render bookkeeping, upload encode, S3 proxy.                                                                                                     |
| `desktop/main/scriptProjects/`         | Local Script Project pipeline: chat, casting, sheets, shots, cut export.                                                                               |
| `desktop/main/vlm/`                    | Local captioning and prompt enhancement with Qwen3-VL.                                                                                                 |
| `desktop/main/localSetup/`             | Setup wizard backend: hardware probe, downloads, node pack install.                                                                                    |
| `desktop/main/renderer/`               | HTTPS renderer origin, self-signed certificate, CSP.                                                                                                   |
| `desktop/preload/preload.ts`           | Exposes `window.mago` through `contextBridge`.                                                                                                         |
| `desktop/shared/`                      | Code shared by main and renderer: IPC contracts, model manifest, groups, pins, licenses, cloud config.                                                 |
| `desktop/installer/SetupLauncher.cs`   | Windows splash wrapper around the Squirrel installer.                                                                                                  |
| `scripts/`                             | Dev launcher, smoke tests, lint guards, installer wrapper, signing hook.                                                                               |
| `tests/`                               | Unit-test factories, MSW handlers and sample videos.                                                                                                   |

## Process model and security

- **Renderer** runs sandboxed: `contextIsolation` on, `nodeIntegration` off.
- **Origin**: `https://desktop.app.mago.studio`, mapped by a Chromium host-resolver rule
  to a loopback TLS listener on port 47821 (`desktop/main/renderer/rendererOrigin.ts`).
  In dev, the listener proxies the Next dev server (`MAGO_RENDERER_URL`).
- **Navigation**: only the renderer host, Clerk and Google sign-in stay in the window.
  Every other URL opens in the system browser.
- **IPC**: the full API is `MagoDesktopApi` and `IPC_CHANNELS` in
  `desktop/shared/contracts.ts`. Namespaces: `app`, `account`, `cloud`, `local-setup`,
  `library`, `files`, `projects`, `script-projects`, `assets`, `image-renders`,
  `video-renders`, `comfy`, `vlm`, `text-model`.
- **Media protocol**: `mago-media://` (`desktop/main/rendererProtocol.ts`) serves
  `asset/<id>`, `thumbnail/<id>`, `script-project/<id>` and an allow-listed
  `cloud-storage/?url=` proxy, with HTTP Range support.
- **`mago://` deep links**: `desktop/main/deepLink.ts` registers the scheme and
  forwards links to `account.onDeepLink`. Nothing consumes them yet; they are kept for
  a future sign-in through the system browser.
- **Secrets**: the main process holds no cloud credentials. The renderer passes
  presigned URLs and ids.

## Data model

Frontend terms, with database and backend names in brackets:

**Project → Shot** (`shots`; backend _timeline_) **→ Track** (`tracks`; backend _layer_)
**→ Clip** (`clips`) **→ Asset** (`assets`).

- A Shot has one **Image Track**, the source video, and any number of **Render Tracks**.
- Render settings are read only through `getTrackRenderSettings(track)`.
- Clips are read only through the accessors in `src/domains/track/utils/`.
  `npm run lint` enforces this with `scripts/checkRawClipAccess.mjs`.

**Project types** (`ProjectTypeSchema`, `src/schemas/scriptProject.ts`):

- `timeline`: **Video-to-video Project**, route `/project`.
- `script_to_shots`: **Script Project** ("Long Form"), route `/script-project`. Local
  state lives in `script_project_snapshots`, `script_project_media` and
  `script_chat_messages`.

**Project origin**: a local Project lives only in the library. A cloud Project
(`origin: "cloud"`) lives in Mago Cloud and is mirrored locally.

## Library folder

- **Location**: default `<userData>/MagoStudio`; the user can change it.
- **Database**: `mago.sqlite3`, migrated by Drizzle (`desktop/main/database/migrations/`),
  backed up every 15 minutes into `backups/`.
- **Tables**: `app_settings`, `projects`, `shots`, `tracks`, `assets`, `clips`,
  `project_assets`, `image_render_jobs`, `cloud_links`, `cloud_render_jobs`,
  `script_project_snapshots`, `script_project_media`, `script_chat_messages`.
- **Folders**: `thumbnails/`, `renders/images/<jobId>`, `renders/videos`,
  `script-projects/`, `temp/`.
- **Source videos are linked, never copied or deleted.** `assets.source_path` holds the
  original absolute path.
- **App settings** live in `<userData>/settings.json` (`LibrarySettings`): app mode,
  ComfyUI endpoint, installed Model groups, accepted licenses, text model provider.

## Rendering

**Provider choice**: `src/platform/modelProviders.ts`. A model is `local-comfy` only if it
appears in `COMFY_LOCAL_VIDEO_MODELS` (`src/platform/localVideoModels.ts`) or
`COMFY_LOCAL_IMAGE_MODELS` (`src/platform/localImageModels.ts`). Every other model is
`mago-cloud`. The main process enforces the same list in
`desktop/main/imageRenders/comfyModelValidation.ts`.

**Local render** (`desktop/main/imageRenders/imageRenderService.ts`):

1. `submitVideo` / `submit` writes the Track, Asset, Clip and `image_render_jobs` rows.
2. A 3-second loop picks up the job. ffmpeg prepares the input, which is uploaded with
   `POST /upload/image`.
3. The model's client builds an API-format graph in TypeScript and sends `POST /prompt`.
   No workflow JSON files are shipped.
4. Progress arrives over `ws://…/ws`; `GET /history/<id>` is the fallback poll.
5. The output is downloaded with `GET /view` into `renders/` and post-processed by ffmpeg.
6. Cancel uses `POST /queue` delete if the job is pending, or `POST /interrupt` if it is
   running.

Before submit, `probeComfyRenderModel` checks the required node classes and model files
through `GET /object_info`.

**Graph builders** (one per family):

- `comfyMiniMaxH3Client.ts`: MiniMax H3.
- `comfyWanAnimateClient.ts`: Wan Animate, VACE, Fun Control, Mago Animate.
- `comfyLtxUpscaleClient.ts`: LTX upscaler.
- `comfyQwenClient.ts`: Qwen Image Edit and Flux 2 Klein.
- `desktop/main/scriptProjects/comfyScriptProjectClient.ts`: script LLM, stills, H3 Shots.
- `desktop/main/vlm/comfyVlmClient.ts`: captions.

**Cloud render** (`src/domains/cloud/`):

1. `submitCloudRender` calls `ensureMirroredShot`, which creates or reuses the
   **Cloud Mirror Project**, Shot and source Asset, uploading the source through S3.
2. It creates a `RENDER` layer and sends `POST /assets/add_render`.
3. `cloud.renders.register` writes the local rows.
4. `pollCloudRenders` watches `GET /queue/project/:id`. `cloud.renders.finish` downloads
   the output once.

Personal fal.ai keys are not supported. Every third-party model runs through Mago Cloud.

**Text and vision routing**: `desktop/shared/textModelRoute.ts`. The cloud route is used
only when the text model provider is `cloud` and the user is signed in. Otherwise
Qwen3.8 27B runs in local ComfyUI. Captions always use local Qwen3-VL. Cloud text calls
go main → `text-model:request` → renderer `TextModelWorker` → backend.

## Models

**Local, on ComfyUI**

| id                          | Name                                                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `minimax_h3_local`          | MiniMax H3 (Local), the default model. VFX modes are in `desktop/shared/minimaxH3VfxModes.ts`.                          |
| `wan_animate_2_2`           | Wan2.2 Animate (Local)                                                                                                  |
| `wan_vace_2_1`              | Wan VACE (Local)                                                                                                        |
| `mago_style_transfer_local` | Mago Style Transfer (Local), Wan2.2 Fun Control                                                                         |
| `mago_animate`              | Mago Animate (Local), Wan-Animate-2 distilled                                                                           |
| `ltx_2_3_spatial_upscaler`  | LTX 2.3 Spatial Upscaler (Local), x2 / x4                                                                               |
| `qwen` (image)              | Qwen Image Edit 2511. Setups: `gguf-q5-4step` (default), `native-int8-8step`, `flux2-klein-4b-q8`, `flux2-klein-9b-q8`. |
| Script Project stills       | `qwen_image_2512_local`, `flux2_klein_4b_q8_local`, `flux2_klein_9b_q8_local`                                           |
| Text                        | `qwen38-27b-q5`, `qwen38-27b-q3`                                                                                        |
| Vision                      | `qwen3-vl-4b-heretic-int8` (default), `qwen3-vl-2b-gguf`                                                                |

**Mago Cloud**

- **Mago engines**: Transform `v3.4.0`, Character `v4.0.0`, Style Transfer `v5.0.0`,
  Inpaint `v5.1.0`, SDR-to-HDR `v7.0.0`, Clean Plate `v8.0.0`, Creative upscaler
  `v1.0_upscaler`, Upscaler `v2.0.0_esrgan_upscaler`.
- **Partner video models**: `seedance_2`, `seedance_2_5`, `happy_horse_1`, `kling_o1`,
  `kling_o3_edit_pro`, `kling_2_6_motion_control`, `kling_3_motion_control`.
- **Partner image models**: `gpt_image_2`, `seedream_5_pro`, `nanobanana_pro`,
  `nanobanana_2`.

Hidden, deprecated and team-only entries are left out. Model `status` decides
visibility.

## Local setup

- **Model groups**: `desktop/shared/localModelGroups.ts` — Minimal (always), Local LLM,
  Qwen Image, Flux Image.
- **Pins**: files and SHA-256 hashes in `desktop/shared/localModelManifest.ts`; node packs
  in `desktop/shared/localNodePackPins.ts`. Nothing ever downloads from a moving branch.
- **Wizard**: UI in `src/app/components/LocalSetupWizard/`, backend
  `desktop/main/localSetup/starterInstaller.ts`. Steps: welcome, hardware, models,
  storage, licenses, download.
- **Bundled ComfyUI**: Windows only. macOS and Linux use their own ComfyUI.
- **Launch and restart**: `ComfyLauncher.ts` and `restartComfy.ts`, Windows and loopback
  endpoints only.
- **Links**: [manual-setup.md](manual-setup.md).

## Configuration

Two kinds of settings exist, and they live in different places.

**Web build variables** (`NEXT_PUBLIC_*`, Clerk test credentials) are read by Next.js
from `.env.local`. `.env.local.template` lists their names; `npm run env:template`
regenerates it from your `.env.local`.

**Desktop variables** (`MAGO_*`) are read from the process environment by Electron,
`next.config.mjs` and the build scripts. They are not loaded from `.env.local`, so they
are not in the template. Set them in your shell; all are optional.

| Variable                                                                    | Read by                                | Effect                                                                 |
| --------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `MAGO_BACKEND_URL`                                                          | `cloudConfig.ts`, `next.config.mjs`    | Mago Cloud API base URL. Default in `desktop/shared/cloud.json`.       |
| `MAGO_CLERK_PUBLISHABLE_KEY`                                                | `cloudConfig.ts`, `next.config.mjs`    | Clerk publishable key for sign-in.                                     |
| `MAGO_RENDERER_HOST`                                                        | `cloudConfig.ts`, `next.config.mjs`    | Hostname the renderer is served from. Must be a Clerk-allowed origin.  |
| `MAGO_CLOUD_STORAGE_HOSTS`                                                  | `cloudConfig.ts`, `next.config.mjs`    | Comma-separated storage hosts the media proxy may fetch.               |
| `MAGO_RENDERER_PORT`                                                        | `rendererOrigin.ts`                    | Loopback TLS port for the renderer origin. Default 47821.              |
| `MAGO_RENDERER_URL`                                                         | `application.ts`                       | Dev only: Next dev server the origin proxies. Set by `npm run dev`.    |
| `MAGO_MIGRATIONS_PATH`                                                      | `databaseManager.ts`                   | Folder of SQLite migrations for unpackaged runs. Set by `npm run dev`. |
| `MAGO_PACKAGED_SMOKE`                                                       | `application.ts`, `databaseManager.ts` | Smoke-test mode for the packaged-app smoke test.                       |
| `MAGO_FORGE_OUT_DIR`                                                        | `forge.config.ts`                      | Output folder for `make:desktop`. Default `release/`.                  |
| `MAGO_APPLE_API_KEY_PATH`, `MAGO_APPLE_API_KEY_ID`, `MAGO_APPLE_API_ISSUER` | `forge.config.ts`                      | All three set, with signing on: notarize the macOS app.                |
| `MAGO_PROFILE_*`                                                            | `desktop/profiling/`                   | Inputs for the local Project profiling test.                           |

`npm run dev:staging` sets the first four to the staging cloud unless they are already set.

## Commands

| Command                                        | Does                                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `npm run dev` / `dev:staging`                  | Next dev server + Electron against production or staging cloud                   |
| `npm run dev:web`                              | Renderer only, in a browser                                                      |
| `npm run build`                                | `build:web` (static export to `out/`) + `build:desktop` (tsc to `desktop-dist/`) |
| `npm run make:desktop`                         | Installers for the current OS into `release/`                                    |
| `npm test`                                     | Vitest. `*.test.ts` runs in Node, `*.dom.test.ts` and `*.test.tsx` in jsdom      |
| `npm run lint` / `type-check` / `format:check` | Same checks as CI                                                                |

## CI and release

- **`.github/workflows/ci.yml`**: on pull requests to `main` — lint, type-check, desktop
  build, tests with coverage thresholds, web build. Docs-only changes skip it.
- **`.github/workflows/format.yml`**: oxfmt check on every pull request.

## Invariants worth knowing

- Local or cloud is a property of the model, never of the build. Routing on `isLocalApp`
  is usually a bug.
- A local Project uploads nothing except the inputs a cloud render needs: the rendered
  Shot, its source video, reference images and masks go to its Cloud Mirror Project.

- The UI reads only from the local library. The cloud is never a read path for display.
- Deleting a Project never deletes a source video.
- Only the main process touches SQLite, the file system and ComfyUI.
- A Cloud Mirror Project is hidden with `settings.mirroredLocalProjectId`, never with
  `active=false`.

## Where to look next

- Domain terms: [CONTEXT.md](../CONTEXT.md).
- Setup wizard behaviour: [installer-user-stories.md](installer-user-stories.md).
