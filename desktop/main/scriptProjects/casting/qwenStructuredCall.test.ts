import { describe, expect, it, vi } from "vitest";

import { CastingModel } from "./castingModels";
import { createQwenStructuredCall } from "./qwenStructuredCall";
import { CastingCallError } from "./scriptCasting";

const SCHEMA = { type: "object", required: ["index", "name", "t2i_prompt"] };

const call = (run: (prompt: string) => Promise<string>) =>
  createQwenStructuredCall(run)({
    contents: ["REGISTRY", "INSTRUCTIONS"],
    schema: SCHEMA,
    model: CastingModel.NamedEntityPrompt,
    stepLabel: "prompts step"
  });

describe("createQwenStructuredCall", () => {
  it("sends the parts and the schema, and returns the pydantic-shaped dump", async () => {
    const run = vi
      .fn()
      .mockResolvedValue(
        '<think>ok</think>{"index": 2.0, "name": "Ben", "t2i_prompt": "Ben.", "extra": 1}'
      );
    await expect(call(run)).resolves.toEqual({
      index: 2,
      name: "Ben",
      t2i_prompt: "Ben."
    });
    const prompt = run.mock.calls[0]![0] as string;
    expect(
      prompt.startsWith("REGISTRY\n\nINSTRUCTIONS\n\nRESPONSE FORMAT:")
    ).toBe(true);
    expect(prompt).toContain(JSON.stringify(SCHEMA));
  });

  it("asks once more with the validation problems", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce('{"name": "Ben"}')
      .mockResolvedValueOnce(
        '{"index": 0, "name": "Ben", "t2i_prompt": "Ben."}'
      );
    await expect(call(run)).resolves.toEqual({
      index: 0,
      name: "Ben",
      t2i_prompt: "Ben."
    });
    expect(run.mock.calls[1]![0]).toContain(
      "RETRY REQUIREMENT: The previous answer was rejected: index: Field required; t2i_prompt: Field required."
    );
  });

  it("fails with the backend's message when the repair is unusable too", async () => {
    const run = vi.fn().mockResolvedValue("not json");
    const failure = call(run);
    await expect(failure).rejects.toBeInstanceOf(CastingCallError);
    await expect(failure).rejects.toThrow(
      "Invalid response from model (prompts step)"
    );
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("lets a model that cannot be reached propagate, so the run pauses", async () => {
    const run = vi.fn().mockRejectedValue(new Error("ComfyUI is unavailable"));
    await expect(call(run)).rejects.toThrow("ComfyUI is unavailable");
    expect(run).toHaveBeenCalledTimes(1);
  });
});
