import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  showMessageBoxSync: vi.fn(),
  showOpenDialogSync: vi.fn(),
  logStartup: vi.fn(),
  pauseStartupTimeout: vi.fn(),
  resumeStartupTimeout: vi.fn()
}));
vi.mock("electron", () => ({
  dialog: mocks,
  app: { getPath: () => "user-data" },
  shell: { showItemInFolder: vi.fn() }
}));
vi.mock("./startupDiagnostics", () => mocks);

import { CorruptLibrarySettingsError } from "./librarySettings";
import { openStartupLibrary } from "./openStartupLibrary";

describe("startup library recovery", () => {
  const settings = {
    getLibraryRoot: vi.fn(),
    getDefaultLibraryRoot: vi.fn(),
    assertWritable: vi.fn(),
    setLibraryRoot: vi.fn(),
    recoverCorruptSettings: vi.fn()
  };
  const manager = { open: vi.fn() };
  beforeEach(() => {
    vi.resetAllMocks();
    settings.getLibraryRoot.mockResolvedValue("original-library");
    settings.getDefaultLibraryRoot.mockReturnValue("default-library");
    mocks.showMessageBoxSync.mockReturnValue(0);
    mocks.showOpenDialogSync.mockReturnValue(["replacement-library"]);
  });
  it("opens a healthy library without prompting or changing settings", async () => {
    await expect(openStartupLibrary(manager, settings)).resolves.toBe(true);
    expect(manager.open).toHaveBeenCalledWith("original-library");
    expect(mocks.showMessageBoxSync).not.toHaveBeenCalled();
    expect(settings.setLibraryRoot).not.toHaveBeenCalled();
  });
  it("restores a selected backup and retries the original library", async () => {
    manager.open.mockRejectedValueOnce(new Error("Damaged database"));
    const recoverable = {
      ...manager,
      listBackups: vi
        .fn()
        .mockResolvedValue(["mago-1791370000000-abc.sqlite3"]),
      restoreBackup: vi.fn().mockResolvedValue("preserved")
    };
    mocks.showMessageBoxSync.mockReturnValueOnce(2).mockReturnValueOnce(0);
    await expect(openStartupLibrary(recoverable, settings)).resolves.toBe(true);
    expect(recoverable.restoreBackup).toHaveBeenCalledWith(
      "original-library",
      "mago-1791370000000-abc.sqlite3"
    );
    expect(manager.open).toHaveBeenCalledTimes(2);
    expect(settings.setLibraryRoot).not.toHaveBeenCalled();
  });
  it("persists a replacement only after it opens successfully", async () => {
    manager.open.mockRejectedValueOnce(new Error("Drive unavailable"));
    manager.open.mockImplementationOnce(async () => {
      expect(settings.setLibraryRoot).not.toHaveBeenCalled();
    });
    await expect(openStartupLibrary(manager, settings)).resolves.toBe(true);
    expect(mocks.showMessageBoxSync).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.stringContaining("Drive unavailable")
      })
    );
    expect(settings.assertWritable).toHaveBeenCalledWith("replacement-library");
    expect(settings.setLibraryRoot).toHaveBeenCalledWith("replacement-library");
    expect(mocks.pauseStartupTimeout).toHaveBeenCalledOnce();
    expect(mocks.resumeStartupTimeout).toHaveBeenCalledOnce();
  });
  it("allows another choice when a replacement database is damaged", async () => {
    manager.open
      .mockRejectedValueOnce(new Error("Original unavailable"))
      .mockRejectedValueOnce(new Error("Malformed database"));
    mocks.showOpenDialogSync
      .mockReturnValueOnce(["damaged-library"])
      .mockReturnValueOnce(["working-library"]);
    await expect(openStartupLibrary(manager, settings)).resolves.toBe(true);
    expect(mocks.showMessageBoxSync).toHaveBeenCalledTimes(2);
    expect(settings.setLibraryRoot).toHaveBeenCalledExactlyOnceWith(
      "working-library"
    );
  });
  it.each(["close", "cancel chooser"])(
    "keeps the original selection when users %s",
    async (action) => {
      manager.open.mockRejectedValueOnce(new Error("Library unavailable"));
      if (action === "close") mocks.showMessageBoxSync.mockReturnValue(1);
      else mocks.showOpenDialogSync.mockReturnValue(undefined);
      await expect(openStartupLibrary(manager, settings)).resolves.toBe(false);
      expect(settings.setLibraryRoot).not.toHaveBeenCalled();
      expect(manager.open).toHaveBeenCalledOnce();
    }
  );
  it("does not open or persist an unwritable replacement", async () => {
    manager.open.mockRejectedValueOnce(new Error("Original unavailable"));
    settings.assertWritable.mockRejectedValueOnce(
      new Error("Read-only folder")
    );
    mocks.showMessageBoxSync.mockReturnValueOnce(0).mockReturnValueOnce(1);
    await expect(openStartupLibrary(manager, settings)).resolves.toBe(false);
    expect(manager.open).toHaveBeenCalledOnce();
    expect(settings.setLibraryRoot).not.toHaveBeenCalled();
  });
  it("recovers damaged settings only after the chosen library opens", async () => {
    settings.getLibraryRoot.mockRejectedValueOnce(
      new CorruptLibrarySettingsError(
        "settings.json",
        new SyntaxError("NUL bytes")
      )
    );
    manager.open.mockImplementationOnce(async () => {
      expect(settings.recoverCorruptSettings).not.toHaveBeenCalled();
    });
    settings.recoverCorruptSettings.mockResolvedValue(
      "settings.json.corrupt.bak"
    );
    await expect(openStartupLibrary(manager, settings)).resolves.toBe(true);
    expect(mocks.showMessageBoxSync).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Mago settings damaged" })
    );
    expect(manager.open).toHaveBeenCalledExactlyOnceWith("replacement-library");
    expect(settings.recoverCorruptSettings).toHaveBeenCalledExactlyOnceWith(
      "replacement-library"
    );
    expect(settings.setLibraryRoot).not.toHaveBeenCalled();
  });
  it("leaves damaged settings untouched if recovery is cancelled", async () => {
    settings.getLibraryRoot.mockRejectedValueOnce(
      new CorruptLibrarySettingsError(
        "settings.json",
        new SyntaxError("NUL bytes")
      )
    );
    mocks.showOpenDialogSync.mockReturnValue(undefined);
    await expect(openStartupLibrary(manager, settings)).resolves.toBe(false);
    expect(settings.recoverCorruptSettings).not.toHaveBeenCalled();
    expect(manager.open).not.toHaveBeenCalled();
  });
  it("keeps the default folder and backs up damaged settings without a picker", async () => {
    settings.getLibraryRoot.mockRejectedValueOnce(
      new CorruptLibrarySettingsError(
        "settings.json",
        new SyntaxError("NUL bytes")
      )
    );
    mocks.showMessageBoxSync.mockReturnValueOnce(3);
    manager.open.mockImplementationOnce(async () => {
      expect(settings.recoverCorruptSettings).not.toHaveBeenCalled();
    });

    await expect(openStartupLibrary(manager, settings)).resolves.toBe(true);

    expect(mocks.showMessageBoxSync).toHaveBeenCalledWith(
      expect.objectContaining({
        buttons: [
          "Choose library folder",
          "Close",
          "Open logs",
          "Keep this folder"
        ],
        detail: expect.stringContaining("default-library")
      })
    );
    expect(mocks.showOpenDialogSync).not.toHaveBeenCalled();
    expect(settings.assertWritable).toHaveBeenCalledExactlyOnceWith(
      "default-library"
    );
    expect(manager.open).toHaveBeenCalledExactlyOnceWith("default-library");
    expect(settings.recoverCorruptSettings).toHaveBeenCalledExactlyOnceWith(
      "default-library"
    );
    expect(settings.setLibraryRoot).not.toHaveBeenCalled();
  });
  it("leaves damaged settings untouched when keeping the folder fails", async () => {
    settings.getLibraryRoot.mockRejectedValueOnce(
      new CorruptLibrarySettingsError(
        "settings.json",
        new SyntaxError("NUL bytes")
      )
    );
    mocks.showMessageBoxSync.mockReturnValueOnce(3).mockReturnValueOnce(1);
    manager.open.mockRejectedValueOnce(new Error("Library unavailable"));

    await expect(openStartupLibrary(manager, settings)).resolves.toBe(false);

    expect(mocks.showOpenDialogSync).not.toHaveBeenCalled();
    expect(settings.recoverCorruptSettings).not.toHaveBeenCalled();
    expect(settings.setLibraryRoot).not.toHaveBeenCalled();
  });
  it("does not reset settings when reading fails because of permissions", async () => {
    const error = Object.assign(new Error("Access denied"), { code: "EACCES" });
    settings.getLibraryRoot.mockRejectedValueOnce(error);
    await expect(openStartupLibrary(manager, settings)).rejects.toBe(error);
    expect(settings.recoverCorruptSettings).not.toHaveBeenCalled();
    expect(manager.open).not.toHaveBeenCalled();
  });
});
