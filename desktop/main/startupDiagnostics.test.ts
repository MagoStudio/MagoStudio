import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  appendFileSync: vi.fn(),
  showMessageBoxSync: vi.fn().mockReturnValue(1),
  showItemInFolder: vi.fn(),
  exit: vi.fn(),
  on: vi.fn(),
  processOn: vi.fn()
}));
vi.mock("node:fs", () => ({
  appendFileSync: mocks.appendFileSync,
  existsSync: () => false,
  mkdirSync: vi.fn(),
  renameSync: vi.fn(),
  statSync: vi.fn()
}));
vi.mock("electron", () => ({
  app: {
    getPath: () => "/app-data",
    getVersion: () => "0.1.0",
    whenReady: () => Promise.resolve(),
    on: mocks.on,
    exit: mocks.exit
  },
  dialog: { showMessageBoxSync: mocks.showMessageBoxSync },
  shell: { showItemInFolder: mocks.showItemInFolder }
}));

describe("startup diagnostics", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.spyOn(process, "on").mockImplementation(mocks.processOn);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  it("reports a startup that never shows a window, opens the log folder, and exits", async () => {
    const diagnostics = await import("./startupDiagnostics.js");
    diagnostics.installStartupDiagnostics();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.showMessageBoxSync).toHaveBeenCalledWith(
      expect.objectContaining({ detail: expect.stringContaining("60 seconds") })
    );
    expect(mocks.showItemInFolder).toHaveBeenCalledWith(
      expect.stringContaining("startup.log")
    );
    expect(mocks.exit).toHaveBeenCalledWith(1);
  });
  it("cancels the timeout once the window is visible", async () => {
    const diagnostics = await import("./startupDiagnostics.js");
    diagnostics.installStartupDiagnostics();
    diagnostics.startupComplete();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.showMessageBoxSync).not.toHaveBeenCalled();
  });
  it("excludes library recovery time from the startup timeout", async () => {
    const diagnostics = await import("./startupDiagnostics.js");
    diagnostics.installStartupDiagnostics();
    diagnostics.pauseStartupTimeout();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(mocks.showMessageBoxSync).not.toHaveBeenCalled();
    diagnostics.resumeStartupTimeout();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.showMessageBoxSync).toHaveBeenCalledOnce();
  });
  it("exits on an uncaught error raised before the window is visible", async () => {
    const diagnostics = await import("./startupDiagnostics.js");
    diagnostics.installStartupDiagnostics();
    diagnostics.handleUncaughtError(new Error("Settings failed to load"));
    await Promise.resolve();
    expect(mocks.showMessageBoxSync).toHaveBeenCalledOnce();
    expect(mocks.exit).toHaveBeenCalledWith(1);
  });
  it("logs an uncaught error raised after the window is visible and keeps running", async () => {
    const diagnostics = await import("./startupDiagnostics.js");
    diagnostics.installStartupDiagnostics();
    diagnostics.startupComplete();
    diagnostics.handleUncaughtError(new Error("assert(!this.paused)"));
    await Promise.resolve();
    expect(mocks.showMessageBoxSync).not.toHaveBeenCalled();
    expect(mocks.exit).not.toHaveBeenCalled();
    expect(mocks.appendFileSync).toHaveBeenCalledWith(
      expect.stringContaining("startup.log"),
      expect.stringContaining("Background error: Error: assert(!this.paused)"),
      "utf8"
    );
  });
  it("routes uncaught exceptions and unhandled rejections through the uncaught error handler", async () => {
    const diagnostics = await import("./startupDiagnostics.js");
    diagnostics.installStartupDiagnostics();
    expect(mocks.processOn).toHaveBeenCalledWith(
      "uncaughtException",
      diagnostics.handleUncaughtError
    );
    expect(mocks.processOn).toHaveBeenCalledWith(
      "unhandledRejection",
      diagnostics.handleUncaughtError
    );
  });
  it("keeps the failure dialog available if writing the log fails", async () => {
    const diagnostics = await import("./startupDiagnostics.js");
    diagnostics.installStartupDiagnostics();
    mocks.appendFileSync.mockImplementationOnce(() => {
      throw new Error("Disk full");
    });
    diagnostics.failStartup(new Error("Invalid settings JSON"));
    await Promise.resolve();
    expect(mocks.showMessageBoxSync).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.stringContaining("Invalid settings JSON")
      })
    );
    expect(mocks.exit).toHaveBeenCalledWith(1);
  });
});
