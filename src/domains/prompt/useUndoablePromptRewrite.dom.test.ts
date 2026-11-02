import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useUndoablePromptRewrite } from "./useUndoablePromptRewrite";

const setup = (rewritePrompt: (prompt: string) => Promise<string>) => {
  let value: string | undefined = "original prompt";
  const onChange = vi.fn((newValue: string | undefined) => {
    value = newValue;
  });

  const { result, rerender } = renderHook<
    ReturnType<typeof useUndoablePromptRewrite>,
    { value: string | undefined }
  >(
    (props) =>
      useUndoablePromptRewrite({
        value: props.value,
        onChange,
        rewritePrompt,
        rewriteFailedMessageKey:
          "notifications.optimize_prompt_failed.description"
      }),
    { initialProps: { value } }
  );

  const rerenderWithLatestValue = () => rerender({ value });

  return { result, onChange, rerenderWithLatestValue };
};

describe("useUndoablePromptRewrite", () => {
  it("leaves the prompt untouched when the rewrite rejects", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const error = new Error("rewrite failed");
    const { result, onChange, rerenderWithLatestValue } = setup(async () => {
      throw error;
    });

    await act(async () => {
      await result.current.rewritePrompt();
    });
    rerenderWithLatestValue();

    expect(onChange).not.toHaveBeenCalled();
    expect(result.current.canUndoRewritePrompt).toBe(false);
    expect(consoleError).toHaveBeenCalledWith("Prompt rewrite failed", error);

    consoleError.mockRestore();
  });
});
