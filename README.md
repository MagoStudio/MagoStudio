# Mago Studio

[![CI](https://github.com/MagoStudio/MagoStudio/actions/workflows/ci.yml/badge.svg)](https://github.com/MagoStudio/MagoStudio/actions/workflows/ci.yml)
[![Format](https://github.com/MagoStudio/MagoStudio/actions/workflows/format.yml/badge.svg)](https://github.com/MagoStudio/MagoStudio/actions/workflows/format.yml)

[![Latest release](https://img.shields.io/github/v/release/MagoStudio/MagoStudio?sort=semver)](https://github.com/MagoStudio/MagoStudio/releases/latest)
[![License: AGPL-3.0-only](https://img.shields.io/github/license/MagoStudio/MagoStudio)](LICENSE)
[![Node](https://img.shields.io/badge/node-24.15-339933?logo=node.js&logoColor=white)](.nvmrc)
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-informational)](https://github.com/MagoStudio/MagoStudio/releases/latest)

The local-first desktop edition of the [Mago](https://mago.studio) AI video editor.
Your projects and your videos stay on your machine. Renders run on your own GPU through
ComfyUI, or in Mago Cloud when you sign in.

A Mago Cloud render uploads only what that render needs: the Shot, its source video,
reference images and masks. The rest of the Project stays local. See
[docs-public/architecture.md](docs-public/architecture.md#3-local--cloud-wiring).

## Vision, mission, goal

- **Vision**: AI filmmaking that belongs to the people making the film — their media,
  their hardware, their choice of model.
- **Mission**: bring the full Mago editor to the desktop, local-first, with open-weight
  models running on the user's own GPU and the cloud as an option, never a requirement.
- **Goal**: a free, open-source app that works with no account and no network, and
  renders the same Projects locally or in Mago Cloud.

## Install

Mago Studio runs on Windows, macOS and Linux. You don't need a GPU to use the app or
render in Mago Cloud. Local rendering is optional (step 3).

1. **Download** the installer for your OS from the
   [latest release](https://github.com/MagoStudio/MagoStudio/releases/latest).
   Windows builds are signed; macOS and Linux builds are unsigned.

2. **Open Mago Studio and choose how to work.**
   - **Sign in with your Mago account** to use Mago Cloud models alongside local ones.
   - **Press Skip** to work offline on your own GPU, with no account. The setup wizard
     opens for you. You can sign in later.

3. Run **Set up local rendering**. On Windows the setup wizard installs ComfyUI, node
   packs and models for you (NVIDIA GPU, 8 GB VRAM minimum, about 63 GB free disk).
   On macOS and Linux, point Mago Studio at your own ComfyUI.

> [!TIP]
> **We recommend the portable ComfyUI the wizard installs.** It comes with the right
> ComfyUI version and node packs already set up. Connecting an existing ComfyUI install
> can cause problems with mismatched nodes or Python versions.

### What the setup does

On Windows, choose **I don't have ComfyUI installed** and the wizard:

1. Checks your GPU. If it can't run local models, you can switch to Mago Cloud instead.
2. Lets you choose where to install, and checks you have enough free space.
3. Asks you to accept the model licenses.
4. Downloads ComfyUI and the models, and checks every file. You can pause and resume
   the download, or keep using the app while it runs.
5. When it's done, click **Launch ComfyUI** to start rendering.

It installs the **Minimal** group, which is everything Mago Studio needs to render with
MiniMax H3 and caption your Shots:

- **MiniMax H3**, the main video model, with a 4-step turbo LoRA for faster renders.
- **MiniMax H3 high quality**, an 8-step LoRA for higher-quality renders.
- **MiniMax H3 VFX LoRAs** for VFX edit, head swap, character swap and style transfer.
- **Qwen3-VL 4B**, which writes captions for your images and video.

The MiniMax H3 files fall under the
[MiniMax H3 Community License](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/LICENSE).

Script writing and reference images use Mago Cloud when you're signed in. To use them
offline, add the optional **Local LLM** and image model groups later from
**Update installation**.

**Using your own ComfyUI?** You'll need ComfyUI v0.34.0 or later, three node packs
(KJNodes, VideoHelperSuite and MiniMax-H3-PDD-Acc) and about 54 GB of models. Choose
**I already have ComfyUI** and enter its address (default `http://127.0.0.1:8188`).
The wizard lists any missing nodes and models.

## Run from source

Requires Node.js 24.15 ([`.nvmrc`](.nvmrc)) and npm 11.

```sh
npm ci
npm run dev            # Electron + Next dev server, production cloud
npm run dev:staging    # same, against the staging cloud
npm run make:desktop   # unsigned installer for the current OS
```

Checks run in CI: `npm run format:check`, `npm run lint`, `npm run type-check`,
`npm test`, `npm run build:web`, `npm run build:desktop`.

## Documentation

| Read this                                                                      | For                                                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| [docs-public/architecture.md](docs-public/architecture.md)                     | Diagrams: processes, local / cloud wiring, Project kinds, model families, installers |
| [docs-public/technical-reference.md](docs-public/technical-reference.md)       | One-page map of the codebase for contributors and AI assistants                      |
| [docs-public/manual-setup.md](docs-public/manual-setup.md)                     | ComfyUI, node pack and model download links for manual setup                         |
| [CONTEXT.md](CONTEXT.md)                                                       | Domain vocabulary (Project, Shot, Track, Cloud Mirror Project…)                      |
| [docs-public/installer-user-stories.md](docs-public/installer-user-stories.md) | When and how the setup wizard opens                                                  |

## Security

Report vulnerabilities privately through GitHub — see [SECURITY.md](SECURITY.md).
Never commit credentials, environment files, real user media, signing material or
local databases.

## License

[GNU AGPL version 3 only](LICENSE). Third-party notices are in [NOTICE.md](NOTICE.md).
Open-weight models are downloaded from their authors and keep their own licenses; the
app asks you to accept the non-permissive ones before downloading.
