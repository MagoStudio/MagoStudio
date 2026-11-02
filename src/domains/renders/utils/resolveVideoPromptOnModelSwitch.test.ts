import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { resolveVideoPromptOnModelSwitch } from "./resolveVideoPromptOnModelSwitch";

const OTHER_MODEL = VideoEngine.V3_4_0;

describe("resolveVideoPromptOnModelSwitch", () => {
  describe("Seedance 2 — a prompt-wipe model", () => {
    it("wipes the prompt to the new model's default when switching in", () => {
      const result = resolveVideoPromptOnModelSwitch({
        previousModel: OTHER_MODEL,
        nextModel: VideoEngine.seedance_2,
        currentPrompt: "a hand-typed prompt",
        nextModelDefaultPrompt: "Seedance default prompt",
        promptMemory: {}
      });

      expect(result).toEqual({
        shouldUpdatePrompt: true,
        nextPrompt: "Seedance default prompt",
        nextPromptMemory: {}
      });
    });

    it("wipes to an empty string when the new model declares no default prompt", () => {
      const result = resolveVideoPromptOnModelSwitch({
        previousModel: OTHER_MODEL,
        nextModel: VideoEngine.seedance_2,
        currentPrompt: "a hand-typed prompt",
        nextModelDefaultPrompt: undefined,
        promptMemory: {}
      });

      expect(result.nextPrompt).toBe("");
      expect(result.shouldUpdatePrompt).toBe(true);
    });

    it("clears the prompt to undefined when switching away from a wipe model to a plain model", () => {
      const result = resolveVideoPromptOnModelSwitch({
        previousModel: VideoEngine.seedance_2,
        nextModel: OTHER_MODEL,
        currentPrompt: "",
        nextModelDefaultPrompt: "plain model default",
        promptMemory: {}
      });

      expect(result).toEqual({
        shouldUpdatePrompt: true,
        nextPrompt: undefined,
        nextPromptMemory: {}
      });
    });
  });

  describe("Happy Horse — the other prompt-wipe model", () => {
    it("wipes the prompt to the new model's default when switching in", () => {
      const result = resolveVideoPromptOnModelSwitch({
        previousModel: OTHER_MODEL,
        nextModel: VideoEngine.happy_horse_1,
        currentPrompt: "a hand-typed prompt",
        nextModelDefaultPrompt: "Happy Horse default prompt",
        promptMemory: {}
      });

      expect(result).toEqual({
        shouldUpdatePrompt: true,
        nextPrompt: "Happy Horse default prompt",
        nextPromptMemory: {}
      });
    });

    it("clears the prompt to undefined when switching away to a plain model", () => {
      const result = resolveVideoPromptOnModelSwitch({
        previousModel: VideoEngine.happy_horse_1,
        nextModel: OTHER_MODEL,
        currentPrompt: "",
        nextModelDefaultPrompt: "plain model default",
        promptMemory: {}
      });

      expect(result.nextPrompt).toBeUndefined();
      expect(result.shouldUpdatePrompt).toBe(true);
    });
  });

  describe("Kling — always empties the prompt on either side of the switch", () => {
    it("empties the prompt when switching into Kling from a plain model", () => {
      const result = resolveVideoPromptOnModelSwitch({
        previousModel: OTHER_MODEL,
        nextModel: VideoEngine.kling_o1,
        currentPrompt: "a hand-typed prompt",
        nextModelDefaultPrompt: "Kling default prompt",
        promptMemory: {}
      });

      expect(result).toEqual({
        shouldUpdatePrompt: true,
        nextPrompt: "",
        nextPromptMemory: {}
      });
    });

    it("empties the prompt when switching away from Kling to a plain model", () => {
      const result = resolveVideoPromptOnModelSwitch({
        previousModel: VideoEngine.kling_o1,
        nextModel: OTHER_MODEL,
        currentPrompt: "a Kling prompt",
        nextModelDefaultPrompt: "plain model default",
        promptMemory: {}
      });

      expect(result).toEqual({
        shouldUpdatePrompt: true,
        nextPrompt: "",
        nextPromptMemory: {}
      });
    });
  });

  describe("the upscaler — remembers the prompt it displaced and restores it later", () => {
    it("remembers the outgoing prompt under 'other' and falls back to the default on first entry", () => {
      const result = resolveVideoPromptOnModelSwitch({
        previousModel: OTHER_MODEL,
        nextModel: VideoEngine.v1_0_0_upscaler,
        currentPrompt: "the plain model's prompt",
        nextModelDefaultPrompt: "upscaler default prompt",
        promptMemory: {}
      });

      expect(result).toEqual({
        shouldUpdatePrompt: true,
        nextPrompt: "upscaler default prompt",
        nextPromptMemory: { other: "the plain model's prompt" }
      });
    });

    it("restores its own remembered prompt on a second entry, over the default", () => {
      const result = resolveVideoPromptOnModelSwitch({
        previousModel: OTHER_MODEL,
        nextModel: VideoEngine.v1_0_0_upscaler,
        currentPrompt: "the plain model's prompt, second time",
        nextModelDefaultPrompt: "upscaler default prompt",
        promptMemory: {
          [VideoEngine.v1_0_0_upscaler]: "remembered upscaler prompt"
        }
      });

      expect(result.nextPrompt).toBe("remembered upscaler prompt");
      expect(result.nextPromptMemory.other).toBe(
        "the plain model's prompt, second time"
      );
    });

    it("restores the remembered 'other' prompt when switching away, and remembers its own prompt for next time", () => {
      const result = resolveVideoPromptOnModelSwitch({
        previousModel: VideoEngine.v1_0_0_upscaler,
        nextModel: OTHER_MODEL,
        currentPrompt: "the upscaler's own prompt",
        nextModelDefaultPrompt: "plain model default",
        promptMemory: { other: "remembered plain-model prompt" }
      });

      expect(result).toEqual({
        shouldUpdatePrompt: true,
        nextPrompt: "remembered plain-model prompt",
        nextPromptMemory: {
          other: "remembered plain-model prompt",
          [VideoEngine.v1_0_0_upscaler]: "the upscaler's own prompt"
        }
      });
    });

    it("does not touch the prompt when switching away with nothing remembered under 'other'", () => {
      const result = resolveVideoPromptOnModelSwitch({
        previousModel: VideoEngine.v1_0_0_upscaler,
        nextModel: OTHER_MODEL,
        currentPrompt: "the upscaler's own prompt",
        nextModelDefaultPrompt: "plain model default",
        promptMemory: {}
      });

      expect(result.shouldUpdatePrompt).toBe(false);
      expect(result.nextPromptMemory).toEqual({
        [VideoEngine.v1_0_0_upscaler]: "the upscaler's own prompt"
      });
    });
  });

  describe("the mask model — wipes to its default, and remembers the upscaler's prompt on the way in", () => {
    it("wipes the prompt to the new model's default when switching in from a plain model", () => {
      const result = resolveVideoPromptOnModelSwitch({
        previousModel: OTHER_MODEL,
        nextModel: VideoEngine.v1_0_0_mask,
        currentPrompt: "a hand-typed prompt",
        nextModelDefaultPrompt: "mask default prompt",
        promptMemory: {}
      });

      expect(result).toEqual({
        shouldUpdatePrompt: true,
        nextPrompt: "mask default prompt",
        nextPromptMemory: {}
      });
    });

    it("remembers the upscaler's prompt under its own key when switching in from the upscaler", () => {
      const result = resolveVideoPromptOnModelSwitch({
        previousModel: VideoEngine.v1_0_0_upscaler,
        nextModel: VideoEngine.v1_0_0_mask,
        currentPrompt: "the upscaler's prompt",
        nextModelDefaultPrompt: "mask default prompt",
        promptMemory: {}
      });

      expect(result).toEqual({
        shouldUpdatePrompt: true,
        nextPrompt: "mask default prompt",
        nextPromptMemory: {
          [VideoEngine.v1_0_0_upscaler]: "the upscaler's prompt"
        }
      });
    });

    it("empties the prompt when switching away from the mask model to a plain model", () => {
      const result = resolveVideoPromptOnModelSwitch({
        previousModel: VideoEngine.v1_0_0_mask,
        nextModel: OTHER_MODEL,
        currentPrompt: "",
        nextModelDefaultPrompt: "plain model default",
        promptMemory: {}
      });

      expect(result).toEqual({
        shouldUpdatePrompt: true,
        nextPrompt: "",
        nextPromptMemory: {}
      });
    });

    it("does not remember the upscaler's prompt when switching from the mask model to the upscaler", () => {
      const result = resolveVideoPromptOnModelSwitch({
        previousModel: VideoEngine.v1_0_0_mask,
        nextModel: VideoEngine.v1_0_0_upscaler,
        currentPrompt: "",
        nextModelDefaultPrompt: "upscaler default prompt",
        promptMemory: {}
      });

      expect(result.nextPromptMemory.other).toBeUndefined();
      expect(result.nextPrompt).toBe("upscaler default prompt");
    });
  });

  it("leaves the prompt untouched on a plain model-to-model switch with no special rule", () => {
    const result = resolveVideoPromptOnModelSwitch({
      previousModel: OTHER_MODEL,
      nextModel: VideoEngine.V4_1_0,
      currentPrompt: "unaffected prompt",
      nextModelDefaultPrompt: "some other default",
      promptMemory: { some: "leftover" }
    });

    expect(result).toEqual({
      shouldUpdatePrompt: false,
      nextPrompt: undefined,
      nextPromptMemory: { some: "leftover" }
    });
  });
});
