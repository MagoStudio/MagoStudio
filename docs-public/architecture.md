# Mago Studio architecture

Diagrams of how Mago Studio fits together. Terms follow [CONTEXT.md](../CONTEXT.md).
For file-level detail, see [technical-reference.md](technical-reference.md). For download
links, see [manual-setup.md](manual-setup.md).

## 1. Processes

Mago Studio is an Electron shell around the static export of the Mago web frontend. Only
the main process touches the disk, SQLite and ComfyUI. The renderer reaches them through
the typed `window.mago` API. Only the renderer talks to the Mago Cloud backend, because it
holds the Clerk session.

```mermaid
flowchart LR
    subgraph Electron["Electron app"]
        direction LR
        R["Renderer<br/>static Next.js export (src/)<br/>served at https://desktop.app.mago.studio"]
        P["Preload<br/>contextBridge → window.mago"]
        M["Main process<br/>desktop/main/"]
        R -- "typed IPC<br/>desktop/shared/contracts.ts" --> P --> M
        M -- "mago-media:// asset, thumbnail,<br/>script-project, cloud-storage" --> R
    end

    M --> DB[("Library folder<br/>mago.sqlite3 · thumbnails · renders · backups")]
    M -. "linked, never copied" .-> SRC[["Source videos<br/>on the user's drives"]]
    M -- "REST /prompt + WebSocket /ws<br/>default http://127.0.0.1:8188" --> C["ComfyUI<br/>local GPU"]
    R -- "HTTPS + Clerk token" --> B["Mago Cloud backend<br/>app.mago.studio/api/v02"]
    R -- "sign-in" --> K["Clerk"]
    M -- "PUT presigned URL · download output" --> S3[("Mago Cloud storage")]
```

**The renderer origin is real HTTPS.** A host-resolver rule maps
`desktop.app.mago.studio` to a loopback TLS listener (port 47821) with a pinned
per-install certificate. Clerk needs a genuine subdomain to sign in.

**One frontend, two builds.** Files named `*.local.ts(x)` shadow their cloud twin at build
time (`next.config.mjs`), so the same component tree runs in the web app and on the desktop.

## 2. App modes and sign-in

```mermaid
flowchart TD
    Start["Launch"] --> Mode{"Saved app mode<br/>settings.json"}
    Mode -- "unchosen" --> Gate["Clerk sign-in screen<br/>Sign in · Sign up · Skip"]
    Mode -- "cloud" --> Cloud["Cloud mode<br/>local + Mago Cloud renders"]
    Mode -- "offline" --> Offline["Offline mode<br/>local identity, zero network"]
    Gate -- "signed in" --> Cloud
    Gate -- "Skip" --> Wizard["Setup wizard opens once"] --> Offline
    Cloud -- "sign out / Work offline" --> Offline
```

Offline mode makes no network request at all.

## 3. Local / cloud wiring

**Local or cloud is a property of the model, not of the build or the Project.** The
provider of each model is `local-comfy` or `mago-cloud` (`src/platform/modelProviders.ts`).

A local Project uploads
nothing, except the inputs a cloud render needs. Those inputs run in a hidden
**Cloud Mirror Project**, one per local Project, linked in the `cloud_links` table.

**What a Mago Cloud render of a local Project uploads:**

- **Mirrored, for that render only**: the Shot being rendered, its source video (trimmed
  to the clip actually used), its reference images and masks, and the render settings.
  The Project, Shot and file names go with them.
- **Never mirrored**: the rest of the Project — other Shots, other source videos, local
  Render Tracks, folders, and the Script Project's script document.
- **Mirrored once, then reused**: an asset already uploaded for an earlier render is not
  uploaded again.
- **Cloud text model**: with Text model set to cloud, casting, shot prompts and Agent
  chat send their text to Mago Cloud. That creates no cloud Project.
- **Signed-out or offline**: nothing is uploaded at all.

```mermaid
flowchart TD
    Submit["User presses Generate on a Shot"] --> Which{"Model provider"}

    Which -- "local-comfy" --> L1["window.mago.videoRenders.submit"]
    L1 --> L2["ImageRenderService<br/>job row in image_render_jobs"]
    L2 --> L3["Pre-flight: required nodes + model files<br/>GET /object_info"]
    L3 --> L4["ffmpeg trims input · upload to ComfyUI<br/>graph built in TypeScript · POST /prompt"]
    L4 --> L5["Progress over WebSocket · GET /history"]
    L5 --> Out["Output saved in library/renders<br/>new Render Track on the Shot"]

    Which -- "mago-cloud" --> Kind{"Project origin"}
    Kind -- "local Project" --> M1["ensureCloudProject<br/>Cloud Mirror Project<br/>settings.mirroredLocalProjectId"]
    M1 --> M2["ensureCloudTimeline · ensureCloudAsset<br/>ffmpeg encode → S3 PUT → ingestion"]
    Kind -- "cloud Project" --> M3["Existing cloud Shot"]
    M2 --> C1["New RENDER layer · POST /assets/add_render"]
    M3 --> C1
    C1 --> C2["Local rows written<br/>CloudRenderSubmitService"]
    C2 --> C3["Poll GET /queue/project/:id"]
    C3 --> C4["Download output once"] --> Out
```

**The cloud is a write path plus one download.** Everything the UI displays is read from
the local library. A finished cloud render becomes an ordinary local asset.

**Cloud Projects work as in the web app.** A Project created with destination
**Mago Cloud** lives in the cloud and is mirrored into the library. Edits and new assets
go back to the cloud.

### Text and vision models

```mermaid
flowchart LR
    Ask["Casting · shot prompt · Agent chat · Optimize prompt"] --> Route{"Text model = cloud<br/>AND signed in?"}
    Route -- "yes" --> Bridge["Main → renderer TextModelWorker<br/>Clerk token → Mago Cloud"]
    Route -- "no" --> Qwen["Local Qwen3.8 27B GGUF<br/>in ComfyUI"]
    Caption["Image / video captions"] --> VLM["Local Qwen3-VL 4B<br/>in ComfyUI, always"]
```

A cloud error is shown to the user. Nothing silently falls back to local.

## 4. Project kinds

| Kind                   | `type`            | Route             | UI name                       |
| ---------------------- | ----------------- | ----------------- | ----------------------------- |
| Video-to-video Project | `timeline`        | `/project`        | Transform your own videos     |
| Script Project         | `script_to_shots` | `/script-project` | Script-to-movie ("Long Form") |

```mermaid
flowchart TB
    subgraph V2V["Video-to-video Project"]
        direction TB
        V1["Import videos<br/>linked from disk"] --> V2["Shot per video<br/>Image Track = source"]
        V2 --> V3["Pick a Video Model<br/>frame range · settings"]
        V3 --> V4["Render Tracks<br/>local or cloud"]
        V4 --> V5["Pin best Render Track<br/>download Project Timeline"]
    end

    subgraph LF["Script Project · Long Form"]
        direction TB
        S1["Script tab<br/>Agent chat writes the script"] --> S2["Cast<br/>script → Assets + Shots"]
        S2 --> S3["Assets tab<br/>reference sheets<br/>Qwen Image 2512 / Flux 2 Klein"]
        S3 --> S4["Shots tab<br/>MiniMax H3 per Shot"]
        S4 --> S5["Timeline tab<br/>pin takes · export cut"]
    end
```

Both kinds share the data model: **Project → Shot → Track → Clip → Asset**. The backend
and the database call a Shot a _timeline_ and a Track a _layer_.

## 5. Model families

```mermaid
flowchart LR
    subgraph Local["Runs locally on ComfyUI"]
        direction TB
        H3["MiniMax H3 (Local) — default<br/>VFX edit · head swap · character swap · style transfer"]
        WAN["Wan<br/>Wan2.2 Animate · Wan VACE 2.1<br/>Mago Style Transfer (Local) · Mago Animate (Local)"]
        LTX["LTX 2.3 Spatial Upscaler<br/>x2 · x4"]
        QIMG["Image: Qwen Image Edit 2511<br/>Flux 2 Klein 4B / 9B setups"]
        TXT["Text: Qwen3.8 27B · Vision: Qwen3-VL 4B"]
    end

    subgraph CloudM["Runs in Mago Cloud (sign-in, credits)"]
        direction TB
        MAGO["Mago engines<br/>Transform · Character · Style Transfer · Inpaint<br/>Clean Plate · SDR-to-HDR · upscalers"]
        THIRD["Partner video models<br/>Seedance 2 / 2.5 · Kling O1 / O3 / Motion Control<br/>Happy Horse"]
        TIMG["Partner image models<br/>GPT Image 2 · Seedream 5 Pro · Nano Banana Pro / 2"]
    end
```

Presets all point at Mago Cloud models. The full list with ids is in
[technical-reference.md](technical-reference.md#models).

## 6. Installers and setup

### Setup wizard (local rendering)

```mermaid
flowchart TD
    Open["Set up local rendering"] --> Have{"ComfyUI already installed?"}

    Have -- "I already have ComfyUI" --> E1["Enter endpoint<br/>default http://127.0.0.1:8188"]
    E1 --> E2["Probe /system_stats, /object_info<br/>list missing nodes + models"]
    E2 --> E3["Download missing items<br/>or install them by hand"]
    E3 --> Done

    Have -- "I don't have ComfyUI (Windows)" --> W1["Hardware: NVIDIA GPU<br/>under 8 GB blocked · 8–16 limited · 16+ ready"]
    W1 --> W2["Models: pick Model groups<br/>Minimal is always on"]
    W2 --> W3["Storage: pick a drive<br/>free space check"]
    W3 --> W4["Licenses: accept non-permissive licenses"]
    W4 --> W5["Download engine ZIP → verify SHA-256 → extract<br/>models → verify → place in ComfyUI/models<br/>node packs → pip install → custom_nodes"]
    W5 --> Done["Launch ComfyUI · Finish"]

    Done -. "later" .-> Update["Update installation<br/>add Model groups · update node packs · restart ComfyUI"]
```

### What each Model group installs

```mermaid
flowchart LR
    ENGINE["ComfyUI engine<br/>Windows portable ZIP<br/>3.39 GB"] --> MIN

    MIN["Minimal · always<br/>KJNodes · VideoHelperSuite · H3 PDD-Acc"] --> MINF["MiniMax H3 model + encoder + VAEs + 4-step LoRA<br/>H3 8-step Acc LoRA<br/>H3 VFX LoRAs<br/>Qwen3-VL 4B captioning"]
    LLM["Local LLM<br/>Simple_Qwen3-VL-gguf"] --> LLMF["Qwen3.8 27B<br/>Q5 if 24 GB+ VRAM, else Q3"]
    QI["Qwen Image<br/>ComfyUI-GGUF"] --> QIF["Qwen Image 2512 Q5 + encoder + VAE + Lightning LoRA"]
    FI["Flux Image<br/>ComfyUI-GGUF"] --> FIF["Flux 2 Klein 4B Q8 + Qwen3 4B encoder + VAE"]
```

Every file and node pack is pinned by SHA-256. Links are in [manual-setup.md](manual-setup.md).
