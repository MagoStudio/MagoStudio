import { EventEmitter } from "node:events";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { spawn, quit } = vi.hoisted(() => ({ spawn: vi.fn(), quit: vi.fn() }));
vi.mock("node:child_process", () => ({ spawn }));
vi.mock("electron", () => ({ app: { quit } }));

import { handleInstallerStartup } from "./installerStartup";

describe("Windows installer startup", () => {
  let child: EventEmitter;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.stubGlobal("process", {
      platform: "win32",
      execPath: path.resolve("installed", "app-0.1.0", "mago-studio.exe"),
      argv: ["mago-studio.exe", "--squirrel-install"]
    });
    child = new EventEmitter();
    spawn.mockReturnValue(child);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  it.each([
    ["--squirrel-install", "--createShortcut"],
    ["--squirrel-updated", "--createShortcut"],
    ["--squirrel-uninstall", "--removeShortcut"]
  ])("handles %s without starting the application", (event, action) => {
    process.argv[1] = event;
    expect(handleInstallerStartup()).toBe(true);
    expect(spawn).toHaveBeenCalledWith(
      path.resolve("installed", "Update.exe"),
      [action, "mago-studio.exe"],
      { windowsHide: true }
    );
    expect(quit).not.toHaveBeenCalled();
    child.emit("exit", 0);
    expect(quit).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(15_000);
    expect(quit).toHaveBeenCalledOnce();
  });
  it("exits if the updater fails to spawn", () => {
    handleInstallerStartup();
    child.emit("error", new Error("Missing updater"));
    expect(quit).toHaveBeenCalledOnce();
  });
  it("exits if the updater hangs", () => {
    handleInstallerStartup();
    vi.advanceTimersByTime(15_000);
    expect(quit).toHaveBeenCalledOnce();
  });
  it("exits obsolete versions immediately", () => {
    process.argv[1] = "--squirrel-obsolete";
    expect(handleInstallerStartup()).toBe(true);
    expect(spawn).not.toHaveBeenCalled();
    expect(quit).toHaveBeenCalledOnce();
  });
  it("allows normal launches", () => {
    process.argv[1] = "--squirrel-firstrun";
    expect(handleInstallerStartup()).toBe(false);
    expect(spawn).not.toHaveBeenCalled();
    expect(quit).not.toHaveBeenCalled();
  });
});
