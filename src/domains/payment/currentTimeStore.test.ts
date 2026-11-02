import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { currentTimeStore } from "./currentTimeStore";

const MINUTE_IN_MS = 60_000;

describe("currentTimeStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-26T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports the current time in whole seconds", () => {
    const unsubscribe = currentTimeStore.subscribe(() => {});

    expect(currentTimeStore.getSnapshot()).toBe(
      Math.floor(new Date("2026-08-26T12:00:00Z").getTime() / 1000)
    );

    unsubscribe();
  });

  it("returns the same snapshot between ticks so React can cache it", () => {
    const unsubscribe = currentTimeStore.subscribe(() => {});

    const first = currentTimeStore.getSnapshot();
    vi.advanceTimersByTime(1_000);

    expect(currentTimeStore.getSnapshot()).toBe(first);

    unsubscribe();
  });

  it("notifies subscribers and advances the snapshot once a minute passes", () => {
    const listener = vi.fn();
    const unsubscribe = currentTimeStore.subscribe(listener);
    const before = currentTimeStore.getSnapshot();

    vi.advanceTimersByTime(MINUTE_IN_MS);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(currentTimeStore.getSnapshot()).toBe(before + 60);

    unsubscribe();
  });

  it("notifies every subscriber on a tick", () => {
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = currentTimeStore.subscribe(first);
    const unsubscribeSecond = currentTimeStore.subscribe(second);

    vi.advanceTimersByTime(MINUTE_IN_MS);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    unsubscribeFirst();
    unsubscribeSecond();
  });

  it("stops ticking once the last subscriber leaves", () => {
    const listener = vi.fn();
    currentTimeStore.subscribe(listener)();

    vi.advanceTimersByTime(MINUTE_IN_MS * 5);

    expect(listener).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps ticking while another subscriber remains", () => {
    const leaving = vi.fn();
    const staying = vi.fn();
    const unsubscribeLeaving = currentTimeStore.subscribe(leaving);
    const unsubscribeStaying = currentTimeStore.subscribe(staying);

    unsubscribeLeaving();
    vi.advanceTimersByTime(MINUTE_IN_MS);

    expect(leaving).not.toHaveBeenCalled();
    expect(staying).toHaveBeenCalledTimes(1);

    unsubscribeStaying();
  });

  it("refreshes the snapshot when a subscriber arrives after an idle stretch", () => {
    currentTimeStore.subscribe(() => {})();

    vi.advanceTimersByTime(MINUTE_IN_MS * 10);
    const unsubscribe = currentTimeStore.subscribe(() => {});

    expect(currentTimeStore.getSnapshot()).toBe(
      Math.floor(new Date("2026-08-26T12:10:00Z").getTime() / 1000)
    );

    unsubscribe();
  });
});
