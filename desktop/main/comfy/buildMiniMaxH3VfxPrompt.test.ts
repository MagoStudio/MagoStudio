import { describe, expect, it } from "vitest";

import {
  resolveMiniMaxH3VfxLora,
  type MiniMaxH3VfxMode
} from "../../shared/minimaxH3VfxModes";

import { buildMiniMaxH3VfxPrompt } from "./buildMiniMaxH3VfxPrompt";

const buildPrompt = (
  mode: Exclude<MiniMaxH3VfxMode, "none">,
  prompt: string,
  isSourceAudioGuided = false
) =>
  buildMiniMaxH3VfxPrompt({
    prompt,
    lora: resolveMiniMaxH3VfxLora(mode, false)!,
    isSourceAudioGuided
  });

describe("buildMiniMaxH3VfxPrompt", () => {
  it("prepends the trigger when the prompt lacks it", () => {
    expect(buildPrompt("head_swap", "Replace the head")).toBe(
      "head_swap: Replace the head"
    );
  });

  it("keeps a prompt that already starts with the trigger, in any case", () => {
    expect(buildPrompt("vfx_edit", "  VFX_EDIT: add fire ")).toBe(
      "VFX_EDIT: add fire"
    );
  });

  it("adds nothing for a mode without a trigger", () => {
    expect(buildPrompt("character_swap", "<Video 1> becomes <Picture 1>")).toBe(
      "<Video 1> becomes <Picture 1>"
    );
  });

  it("names the guided source in words and renumbers later video tags", () => {
    expect(
      buildPrompt("style_transfer", "<Video 1> in the style of <Video 2>")
    ).toBe("style_transfer: the source video in the style of <Video 1>");
  });

  it("names the guided soundtrack only when the source audio is guided", () => {
    expect(buildPrompt("vfx_edit", "<Audio 1> stays", true)).toBe(
      "vfx_edit: the source soundtrack stays"
    );
    expect(buildPrompt("vfx_edit", "<Audio 1> stays", false)).toBe(
      "vfx_edit: <Audio 1> stays"
    );
  });

  it("keeps <Video 1> when the source stays a reference video", () => {
    expect(buildPrompt("character_swap", "<Video 1>")).toBe("<Video 1>");
  });
});
