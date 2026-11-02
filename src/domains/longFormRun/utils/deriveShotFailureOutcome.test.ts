import { AssetStatus } from "@schemas/asset";
import { LayerType } from "@schemas/layer";
import { createLayer } from "@tests/factories/layer";
import { describe, expect, it } from "vitest";

import {
  deriveShotFailureOutcome,
  SHOT_FAILURE_MESSAGE_MAX_LENGTH
} from "./deriveShotFailureOutcome";

const erroredTrack = (message?: string) => {
  const renderTrack = createLayer({ type: LayerType.RENDER });
  renderTrack.clips[0].asset.data.queue_status = AssetStatus.ERROR;
  if (message !== undefined) {
    renderTrack.clips[0].asset.data.error = { error: message };
  }
  return renderTrack;
};

const cancelledTrack = (message?: string) => {
  const renderTrack = createLayer({ type: LayerType.RENDER });
  renderTrack.clips[0].asset.data.queue_status = AssetStatus.CANCELLED;
  if (message !== undefined) {
    renderTrack.clips[0].asset.data.error = { error: message };
  }
  return renderTrack;
};

describe("deriveShotFailureOutcome", () => {
  it("returns the errored outcome with the backend's message", () => {
    const renderTrack = erroredTrack("Something broke.");

    expect(deriveShotFailureOutcome([renderTrack])).toEqual({
      outcome: "errored",
      message: "Something broke."
    });
  });

  it("returns the cancelled outcome", () => {
    const renderTrack = cancelledTrack();

    expect(deriveShotFailureOutcome([renderTrack])).toEqual({
      outcome: "cancelled",
      message: undefined
    });
  });

  it("returns undefined message for a failed Render Track with no backend message", () => {
    const renderTrack = erroredTrack();

    expect(deriveShotFailureOutcome([renderTrack])?.message).toBeUndefined();
  });

  it("returns undefined message for an empty backend message, not a blank string", () => {
    const renderTrack = erroredTrack("");

    expect(deriveShotFailureOutcome([renderTrack])?.message).toBeUndefined();
  });

  it("falls back to undefined when the backend sent a non-string message (object)", () => {
    const renderTrack = erroredTrack();
    renderTrack.clips[0].asset.data.error = {
      error: { unexpected: "shape" } as unknown as string
    };

    expect(deriveShotFailureOutcome([renderTrack])?.message).toBeUndefined();
  });

  it("falls back to undefined when the backend sent a non-string message (number)", () => {
    const renderTrack = erroredTrack();
    renderTrack.clips[0].asset.data.error = {
      error: 500 as unknown as string
    };

    expect(deriveShotFailureOutcome([renderTrack])?.message).toBeUndefined();
  });

  it("collapses newlines into a single line before capping", () => {
    const messageWithNewlines = "Line one.\nLine two.\nLine three.";
    const renderTrack = erroredTrack(messageWithNewlines);

    expect(deriveShotFailureOutcome([renderTrack])?.message).toBe(
      "Line one. Line two. Line three."
    );
  });

  it("falls back to undefined for an all-spaces message", () => {
    const renderTrack = erroredTrack("     ");

    expect(deriveShotFailureOutcome([renderTrack])?.message).toBeUndefined();
  });

  it("falls back to undefined for a message made only of newlines and tabs", () => {
    const renderTrack = erroredTrack("\n\n\t\t\n");

    expect(deriveShotFailureOutcome([renderTrack])?.message).toBeUndefined();
  });

  it("truncates a backend message longer than the cap", () => {
    const longMessage = "x".repeat(SHOT_FAILURE_MESSAGE_MAX_LENGTH + 50);
    const renderTrack = erroredTrack(longMessage);

    const message = deriveShotFailureOutcome([renderTrack])?.message;

    expect(message).toHaveLength(SHOT_FAILURE_MESSAGE_MAX_LENGTH + 1);
    expect(message?.endsWith("…")).toBe(true);
  });

  it("returns undefined when the Shot has not failed", () => {
    const renderTrack = createLayer({ type: LayerType.RENDER });
    renderTrack.clips[0].asset.data.queue_status = AssetStatus.INPROGRESS;

    expect(deriveShotFailureOutcome([renderTrack])).toBeUndefined();
  });

  it("returns undefined when a playable Render Track outranks a failed one", () => {
    const failedRenderTrack = erroredTrack();
    const playableRenderTrack = createLayer({ type: LayerType.RENDER });
    playableRenderTrack.clips[0].asset.data.queue_status = AssetStatus.FINISHED;

    expect(
      deriveShotFailureOutcome([failedRenderTrack, playableRenderTrack])
    ).toBeUndefined();
  });

  it("returns undefined when a playable Render Track outranks a failed one, reversed order", () => {
    const playableRenderTrack = createLayer({ type: LayerType.RENDER });
    playableRenderTrack.clips[0].asset.data.queue_status = AssetStatus.FINISHED;
    const failedRenderTrack = erroredTrack();

    expect(
      deriveShotFailureOutcome([playableRenderTrack, failedRenderTrack])
    ).toBeUndefined();
  });

  it("picks the first errored track's message when two Render Tracks errored", () => {
    const firstError = erroredTrack("First failure.");
    const secondError = erroredTrack("Second failure.");

    expect(deriveShotFailureOutcome([firstError, secondError])).toEqual({
      outcome: "errored",
      message: "First failure."
    });
  });

  it("prefers an errored outcome over a cancelled one, errored first", () => {
    const errored = erroredTrack("It errored.");
    const cancelled = cancelledTrack();

    expect(deriveShotFailureOutcome([errored, cancelled])).toEqual({
      outcome: "errored",
      message: "It errored."
    });
  });

  it("prefers an errored outcome over a cancelled one, cancelled first", () => {
    const cancelled = cancelledTrack();
    const errored = erroredTrack("It errored.");

    expect(deriveShotFailureOutcome([cancelled, errored])).toEqual({
      outcome: "errored",
      message: "It errored."
    });
  });
});
