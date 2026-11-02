# Manual setup: ComfyUI, node packs and models

Use this page to run Mago Studio's local models on your own ComfyUI, on any OS. On Windows
the setup wizard does all of this for you; see [architecture.md](architecture.md#6-installers-and-setup).

All paths are relative to the ComfyUI folder. The code is the source of truth:

- Model files and SHA-256 hashes: [`desktop/shared/localModelManifest.ts`](../desktop/shared/localModelManifest.ts)
- Model groups: [`desktop/shared/localModelGroups.ts`](../desktop/shared/localModelGroups.ts)
- Node pack pins: [`desktop/shared/localNodePackPins.ts`](../desktop/shared/localNodePackPins.ts)
- Licenses: [`desktop/shared/localModelLicenses.ts`](../desktop/shared/localModelLicenses.ts)

If this page and the code disagree, the code wins. Please open an issue.

## 1. ComfyUI

- **Core**: <https://github.com/Comfy-Org/ComfyUI>. MiniMax H3 VFX modes need the
  `MiniMaxH3AddGuide` node, which ships in ComfyUI v0.34.0 and later.
- **Windows bundle used by the wizard** (portable, Python embedded, pinned node packs
  included): <https://downloads.app.mago.studio/ComfyUI_windows_portable_mago-5-10-2026.zip>
  — 3.39 GB, SHA-256 `4319814af3bfe8b446b02bc69db9bd5531cb13dc16db79f3455f6ea8f54b22da`.
- **Endpoint**: Mago Studio expects `http://127.0.0.1:8188` by default. Change it in
  **Settings**.
- **Check your setup**: run **Set up local rendering → I already have ComfyUI**. It lists
  every missing node and model file with its folder and link.

## 2. Node packs

### Pinned (installed by the wizard)

| Pack                                                                                      | Pinned revision                            | Archive                                                                                                                 | Model group                                     |
| ----------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes)                               | 1.5.0                                      | <https://cdn.comfy.org/kijai/comfyui-kjnodes/1.5.0/node.zip>                                                            | Minimal                                         |
| [ComfyUI-VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite)       | 1.7.9                                      | <https://cdn.comfy.org/kosinkadink/comfyui-videohelpersuite/1.7.9/node.zip>                                             | Minimal                                         |
| [ComfyUI-MiniMax-H3-PDD-Acc](https://github.com/Jalen-Brunson/ComfyUI-MiniMax-H3-PDD-Acc) | `311a65dd53832d8a5f8177a9d5fb923c09e35a90` | [zip](https://github.com/Jalen-Brunson/ComfyUI-MiniMax-H3-PDD-Acc/archive/311a65dd53832d8a5f8177a9d5fb923c09e35a90.zip) | Minimal                                         |
| [ComfyUI_Simple_Qwen3-VL-gguf](https://github.com/KLL535/ComfyUI_Simple_Qwen3-VL-gguf)    | `85b92359595a450d6c37f0eccf210a8a1069f72e` | [zip](https://github.com/KLL535/ComfyUI_Simple_Qwen3-VL-gguf/archive/85b92359595a450d6c37f0eccf210a8a1069f72e.zip)      | Local LLM                                       |
| [ComfyUI-GGUF](https://github.com/city96/ComfyUI-GGUF)                                    | 1.1.10                                     | <https://cdn.comfy.org/city96/ComfyUI-GGUF/1.1.10/node.zip>                                                             | Qwen Image, Flux Image                          |
| [ComfyUI-MagoNodes](https://github.com/MagoStudio/ComfyUI-MagoNodes)                      | `63e0307d59ce15341f38f9928f66e0f3e91a4709` | [zip](https://github.com/MagoStudio/ComfyUI-MagoNodes/archive/63e0307d59ce15341f38f9928f66e0f3e91a4709.zip)             | none (in the Windows bundle; LTX tiled sampler) |

Install each into `custom_nodes/`, then run `pip install -r requirements.txt` with
ComfyUI's own Python, and restart ComfyUI.

### Not pinned (install by hand for the Wan and LTX models)

| Pack                                                   | Needed by                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| <https://github.com/Fannovel16/comfyui_controlnet_aux> | Wan2.2 Animate, Wan VACE                                                             |
| <https://github.com/kijai/ComfyUI-segment-anything-2>  | Wan2.2 Animate (Mix mode)                                                            |
| <https://github.com/Lightricks/ComfyUI-LTXVideo>       | LTX 2.3 Spatial Upscaler                                                             |
| <https://github.com/RealRebelAI/Rebels_w3a8_Loader>    | Mago Animate (Local), GGUF option — move the inner folder up one level after cloning |

## 3. Models by Model group

Sizes are decimal GB.

### Minimal (always installed) — MiniMax H3 and captioning

| Folder                    | File                                                                                                                                                                                               | Size  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `models/diffusion_models` | [minimax_h3_ref2va_pruned_int8_convrot.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/diffusion_models/minimax_h3_ref2va_pruned_int8_convrot.safetensors)                   | 20.97 |
| `models/text_encoders`    | [qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors)                                | 15.69 |
| `models/vae`              | [minimax_h3_video_vae_fp16.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_fp16.safetensors)                                                        | 5.21  |
| `models/vae`              | [minimax_h3_audio_vae_fp32.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors)                                                        | 0.61  |
| `models/loras`            | [minimax_h3_ref2v_turbo_4step_v0.1_comfyui_bf16.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/loras/minimax_h3_ref2v_turbo_4step_v0.1_comfyui_bf16.safetensors)            | 1.96  |
| `models/pdd_acc`          | [MiniMax-H3-Ref2VA-Acc-8Step.safetensors](https://huggingface.co/alibaba-pai/MiniMax-H3-Acc-LoRAs/resolve/main/MiniMax-H3-Ref2VA-Acc-8Step.safetensors)                                            | 1.37  |
| `models/loras`            | [minimax_h3_vfx_edit_v1.0_r128.safetensors](https://huggingface.co/Alissonerdx/Minimax-H3-ComfyUI/resolve/main/loras/minimax_h3_vfx_edit_v1.0_r128.safetensors)                                    | 1.24  |
| `models/loras`            | [minimax_h3_vfx_edit_v1.0_r128_ffp.safetensors](https://huggingface.co/Alissonerdx/Minimax-H3-ComfyUI/resolve/main/loras/minimax_h3_vfx_edit_v1.0_r128_ffp.safetensors)                            | 1.24  |
| `models/loras`            | [minimax_h3_head_swap_v1.0_r32.safetensors](https://huggingface.co/Alissonerdx/Minimax-H3-ComfyUI/resolve/main/loras/minimax_h3_head_swap_v1.0_r32.safetensors)                                    | 0.31  |
| `models/loras`            | [h3_character_swap_pro4500_1000.safetensors](https://huggingface.co/akatz-ai/MiniMax-H3-Character-Swap-LoRA/resolve/main/h3_character_swap_pro4500_1000.safetensors)                               | 0.16  |
| `models/loras`            | [minimax_h3_style_transfer_v1.0_r64.safetensors](https://huggingface.co/Alissonerdx/Minimax-H3-ComfyUI/resolve/main/loras/minimax_h3_style_transfer_v1.0_r64.safetensors)                          | 0.62  |
| `models/text_encoders`    | [qwen3-vl-4b-heretic_int8_dynamic_convrot.safetensors](https://huggingface.co/ethanfel/Qwen3-VL-4B-Heretic-ComfyUI-ConvRot-INT8/resolve/main/qwen3-vl-4b-heretic_int8_dynamic_convrot.safetensors) | 4.84  |

About 54 GB. With the engine ZIP and its extraction, plan for about 63 GB free.

### Local LLM — Script Project text model

Pick one. The wizard picks Q5 with 24 GB VRAM or more, otherwise Q3.

| Folder                 | File                                                                                                                    | Size  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----- |
| `models/text_encoders` | [Qwen3.8-27B-UD-Q5_K_XL.gguf](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF/resolve/main/Qwen3.8-27B-UD-Q5_K_XL.gguf) | 20.88 |
| `models/text_encoders` | [Qwen3.8-27B-UD-Q3_K_XL.gguf](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF/resolve/main/Qwen3.8-27B-UD-Q3_K_XL.gguf) | 13.15 |

### Qwen Image — Script Project reference sheets

| Folder                 | File                                                                                                                                                                                    | Size  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `models/unet`          | [qwen-image-2512-Q5_K_M.gguf](https://huggingface.co/unsloth/Qwen-Image-2512-GGUF/resolve/main/qwen-image-2512-Q5_K_M.gguf)                                                             | 15.00 |
| `models/text_encoders` | [qwen_2.5_vl_7b_fp8_scaled.safetensors](https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors)               | 9.38  |
| `models/vae`           | [qwen_image_vae.safetensors](https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/vae/qwen_image_vae.safetensors)                                               | 0.25  |
| `models/loras`         | [Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors](https://huggingface.co/lightx2v/Qwen-Image-2512-Lightning/resolve/main/Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors) | 1.70  |

### Flux Image — Flux 2 Klein 4B

| Folder                 | File                                                                                                                                                       | Size |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `models/unet`          | [flux-2-klein-4b-Q8_0.gguf](https://huggingface.co/unsloth/FLUX.2-klein-4B-GGUF/resolve/main/flux-2-klein-4b-Q8_0.gguf)                                    | 4.30 |
| `models/text_encoders` | [qwen_3_4b.safetensors](https://huggingface.co/Comfy-Org/vae-text-encorder-for-flux-klein-4b/resolve/main/split_files/text_encoders/qwen_3_4b.safetensors) | 8.04 |
| `models/vae`           | [flux2-vae.safetensors](https://huggingface.co/Comfy-Org/vae-text-encorder-for-flux-klein-4b/resolve/main/split_files/vae/flux2-vae.safetensors)           | 0.34 |

## 4. Models outside the Model groups

The wizard does not download these. Mago Studio checks for them before a render and tells
you what is missing.

### Wan2.2 Animate (Local)

| Folder                    | File                                                                                                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `models/diffusion_models` | [Wan2_2-Animate-14B_fp8_e4m3fn_scaled_KJ.safetensors](https://huggingface.co/Kijai/WanVideo_comfy_fp8_scaled/resolve/main/Wan22Animate/Wan2_2-Animate-14B_fp8_e4m3fn_scaled_KJ.safetensors)        |
| `models/text_encoders`    | [umt5_xxl_fp8_e4m3fn_scaled.safetensors](https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors)                |
| `models/vae`              | [wan_2.1_vae.safetensors](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors)                                                        |
| `models/clip_vision`      | [clip_vision_h.safetensors](https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/clip_vision/clip_vision_h.safetensors)                                            |
| `models/loras`            | [lightx2v_I2V_14B_480p_cfg_step_distill_rank64_bf16.safetensors](https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/Lightx2v/lightx2v_I2V_14B_480p_cfg_step_distill_rank64_bf16.safetensors) |
| `models/loras`            | [WanAnimate_relight_lora_fp16.safetensors](https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/LoRAs/Wan22_relight/WanAnimate_relight_lora_fp16.safetensors)                                  |

Mix mode also needs `sam2_hiera_base_plus.safetensors`, which ComfyUI-segment-anything-2
downloads itself. The pose and depth preprocessors download their own checkpoints on first run.

### Wan VACE 2.1 (Local)

| Folder                    | File                                                                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `models/diffusion_models` | [wan2.1_vace_14B_fp8_e4m3fn.safetensors](https://huggingface.co/Kamikaze-88/Wan2.1-VACE-14B-fp8/resolve/main/wan2.1_vace_14B_fp8_e4m3fn.safetensors) (14B)                                 |
| `models/diffusion_models` | [wan2.1_vace_1.3B_fp16.safetensors](https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/diffusion_models/wan2.1_vace_1.3B_fp16.safetensors) (1.3B option) |
| `models/text_encoders`    | umt5_xxl_fp8_e4m3fn_scaled.safetensors (same as Wan2.2 Animate)                                                                                                                            |
| `models/vae`              | [wan_2.1_vae.safetensors](https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors)                                                |

### Mago Style Transfer (Local) — Wan2.2 Fun Control

| Folder                               | File                                                                                                                                                                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `models/diffusion_models`            | [wan2.2_fun_control_high_noise_14B_fp8_scaled.safetensors](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_fun_control_high_noise_14B_fp8_scaled.safetensors) |
| `models/diffusion_models`            | [wan2.2_fun_control_low_noise_14B_fp8_scaled.safetensors](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_fun_control_low_noise_14B_fp8_scaled.safetensors)   |
| `models/loras`                       | [wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors)          |
| `models/loras`                       | [wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors)            |
| `models/unet`                        | GGUF option: `Wan2.2-Fun-A14B-Control_HighNoise-<quant>.gguf` and `_LowNoise-<quant>.gguf` from <https://huggingface.co/QuantStack/Wan2.2-Fun-A14B-Control-GGUF>                                                           |
| `models/text_encoders`, `models/vae` | umt5 encoder and Wan 2.1 VAE, as for Wan VACE                                                                                                                                                                              |

### Mago Animate (Local) — Wan-Animate-2 distilled

| Folder                    | File                                                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `models/diffusion_models` | [wan_animate_2_distill_int8_convrot.safetensors](https://huggingface.co/Comfy-Org/Wan-Animate-2/resolve/main/diffusion_models/wan_animate_2_distill_int8_convrot.safetensors) (int8 option) |
| `models/unet`             | GGUF option (default Q4_K_M): `Wan-Animate-2-14B-TURBO-<quant>.gguf` from <https://huggingface.co/realrebelai/Wan-Animate-2_GGUFs/tree/main/Distilled>                                      |
| `models/text_encoders`    | [umt5_xxl_fp8_e4m3fn_scaled.safetensors](https://huggingface.co/Comfy-Org/Wan-Animate-2/resolve/main/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors)                                  |
| `models/clip_vision`      | [clip_vision_h.safetensors](https://huggingface.co/Comfy-Org/Wan-Animate-2/resolve/main/clip_vision/clip_vision_h.safetensors)                                                              |
| `models/vae`              | [Wan2_1_VAE_bf16.safetensors](https://huggingface.co/Comfy-Org/Wan-Animate-2/resolve/main/vae/Wan2_1_VAE_bf16.safetensors)                                                                  |

### LTX 2.3 Spatial Upscaler (Local)

From <https://huggingface.co/unsloth/LTX-2.3-GGUF>:

- `models/unet/ltx-2.3-22b-distilled-1.1-UD-Q5_K_M.gguf`
- `models/text_encoders/gemma_3_12B_it_fp4_mixed.safetensors`
- `models/text_encoders/ltx-2.3-22b-dev_embeddings_connectors.safetensors`
- `models/vae/ltx-2.3-22b-distilled_video_vae.safetensors`
- `models/vae/ltx-2.3-22b-distilled_audio_vae.safetensors`

From Lightricks, into `models/loras`:

- [ltx-2.3-22b-ic-lora-pixel-spatial-upscaler-x2-0.9.safetensors](https://huggingface.co/Lightricks/LTX-2.3-22b-IC-LoRA-Pixel-Spatial-Upscaler/resolve/main/ltx-2.3-22b-ic-lora-pixel-spatial-upscaler-x2-0.9.safetensors)
- [ltx-2.3-22b-ic-lora-pixel-spatial-upscaler-x4-0.9.safetensors](https://huggingface.co/Lightricks/LTX-2.3-22b-IC-LoRA-Pixel-Spatial-Upscaler/resolve/main/ltx-2.3-22b-ic-lora-pixel-spatial-upscaler-x4-0.9.safetensors)

### Qwen Image Edit 2511 (Local image model)

Both setups also use the Qwen Image text encoder and VAE listed above.

| Setup                      | Folder                    | File                                                                                                                                                                                                   |
| -------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GGUF Q5, 4 steps (default) | `models/unet`             | [qwen-image-edit-2511-Q5_K_M.gguf](https://huggingface.co/unsloth/Qwen-Image-Edit-2511-GGUF/resolve/main/qwen-image-edit-2511-Q5_K_M.gguf) — save as `Qwen-Image-Edit-2511-Q5_K_M.gguf`                |
| GGUF Q5, 4 steps           | `models/loras`            | [Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors](https://huggingface.co/lightx2v/Qwen-Image-Edit-2511-Lightning/resolve/main/Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors) |
| Native int8, 8 steps       | `models/diffusion_models` | [qwen_image_edit_2511_int8_convrot.safetensors](https://huggingface.co/Comfy-Org/Qwen-Image-Edit_ComfyUI/resolve/main/split_files/diffusion_models/qwen_image_edit_2511_int8_convrot.safetensors)      |
| Native int8, 8 steps       | `models/loras`            | [Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16.safetensors](https://huggingface.co/lightx2v/Qwen-Image-Edit-2511-Lightning/resolve/main/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16.safetensors) |

### Flux 2 Klein 9B (image setup and Script Project stills)

| Folder                 | File                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `models/unet`          | [flux-2-klein-9b-Q8_0.gguf](https://huggingface.co/unsloth/FLUX.2-klein-9B-GGUF/resolve/main/flux-2-klein-9b-Q8_0.gguf)                                                      |
| `models/text_encoders` | [qwen_3_8b_fp8mixed.safetensors](https://huggingface.co/Comfy-Org/vae-text-encorder-for-flux-klein-9b/resolve/main/split_files/text_encoders/qwen_3_8b_fp8mixed.safetensors) |
| `models/vae`           | flux2-vae.safetensors (same as Flux 2 Klein 4B)                                                                                                                              |

### Script Project MiniMax H3 alternatives

| Folder                    | File                                                                                                                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `models/diffusion_models` | [Minimax-h3_Singularity_ref2va_Pruned_v1.3_int8.safetensors](https://huggingface.co/WarmBloodAban/Minimax-h3_Singularity/resolve/main/Minimax-h3_Singularity_ref2va_Pruned_v1.3_int8.safetensors)                                                                                    |
| `models/text_encoders`    | [qwen3vl_32b_h3_ultra_uncensored_heretic_int8_convrot.safetensors](https://huggingface.co/ethanfel/Qwen3-VL-32B-Ultra-Heretic-H3-ComfyUI-INT8-ConvRot/resolve/main/qwen3vl_32b_h3_ultra_uncensored_heretic_int8_convrot.safetensors)                                                 |
| `models/loras`            | [minimax_h3_ref2v_turbo_8step_v1.0_768p_comfyui_bf16.safetensors](https://huggingface.co/lightx2v/Minimax-h3-Turbo/resolve/main/minimax_h3_ref2v_turbo_8step_v1.0_768p_comfyui_bf16.safetensors)                                                                                     |
| `models/loras`            | [taomate_h3_3step_comfy.safetensors](https://huggingface.co/Robert1212star/TaoMate-H3-3Step-ComfyUI/resolve/main/taomate_h3_3step_comfy.safetensors) — save as `robert-taomate_h3_3step_comfy.safetensors`, about 2.48 GB. Source matched by name only; the app pins no hash for it. |

### Qwen3-VL 2B GGUF captioning (alternative backend)

From <https://huggingface.co/unsloth/Qwen3-VL-2B-Instruct-GGUF>, into `models/LLM/GGUF`:
`Qwen3-VL-2B-Instruct-UD-Q8_K_XL.gguf` and `mmproj-BF16.gguf`. This path needs the
`MagoQwen3VLLoader` and `MagoQwen3VLCaption` nodes, which the pinned MagoNodes revision
does not include. The default 4B captioning model above does not need them.

## 5. Licenses

Models keep their authors' licenses. Mago Studio asks you to accept the non-permissive
ones before it downloads them.

| License                                                                                                      | Repositories                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| [MiniMax H3 Community License](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/LICENSE)                | Comfy-Org/MiniMax-H3, alibaba-pai/MiniMax-H3-Acc-LoRAs, Alissonerdx/Minimax-H3-ComfyUI, akatz-ai/MiniMax-H3-Character-Swap-LoRA |
| [FLUX Non-Commercial License](https://huggingface.co/black-forest-labs/FLUX.2-klein-9B/blob/main/LICENSE.md) | unsloth/FLUX.2-klein-9B-GGUF, Comfy-Org/vae-text-encorder-for-flux-klein-9b                                                     |
| Apache 2.0                                                                                                   | Qwen3-VL 4B and 2B, Qwen Image 2512 and its LoRA, Qwen3.8 27B, Flux 2 Klein 4B and its encoder/VAE                              |

The Wan, LTX and Qwen Image Edit files are not in the license register. Check each
repository's own license before commercial use.
