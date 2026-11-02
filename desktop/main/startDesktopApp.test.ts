import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handleInstallerStartup: vi.fn(),
  migrateLegacyProfile: vi.fn(),
  getPath: vi.fn(),
  setPath: vi.fn(),
  requestSingleInstanceLock: vi.fn(),
  quit: vi.fn(),
  installStartupDiagnostics: vi.fn(),
  failStartup: vi.fn()
}));
vi.mock("electron", () => ({ app: mocks }));
vi.mock("./migrateLegacyProfile", () => ({
  migrateLegacyProfile: mocks.migrateLegacyProfile
}));
vi.mock("./installerStartup", () => ({
  handleInstallerStartup: mocks.handleInstallerStartup
}));
vi.mock("./startupDiagnostics", () => ({
  installStartupDiagnostics: mocks.installStartupDiagnostics,
  failStartup: mocks.failStartup
}));

import { startDesktopApp } from "./startDesktopApp";

describe("desktop startup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.handleInstallerStartup.mockReturnValue(false);
    mocks.requestSingleInstanceLock.mockReturnValue(true);
    mocks.getPath.mockImplementation((name: string) => `/${name}`);
    mocks.migrateLegacyProfile.mockReturnValue("/userData");
  });
  it("keeps installer runs invisible without starting app services", () => {
    mocks.handleInstallerStartup.mockReturnValue(true);
    const loadApplication = vi.fn();
    startDesktopApp(loadApplication);
    expect(loadApplication).not.toHaveBeenCalled();
    expect(mocks.requestSingleInstanceLock).not.toHaveBeenCalled();
    expect(mocks.installStartupDiagnostics).not.toHaveBeenCalled();
  });
  it("starts the application once after installation, with diagnostics installed first", () => {
    const loadApplication = vi.fn(() => {
      expect(mocks.installStartupDiagnostics).toHaveBeenCalledOnce();
    });
    startDesktopApp(loadApplication);
    expect(loadApplication).toHaveBeenCalledOnce();
  });
  it("does not start a second application instance", () => {
    mocks.requestSingleInstanceLock.mockReturnValue(false);
    const loadApplication = vi.fn();
    startDesktopApp(loadApplication);
    expect(loadApplication).not.toHaveBeenCalled();
    expect(mocks.quit).toHaveBeenCalledOnce();
  });
  it("reports application load failures", () => {
    const error = new Error("Missing application module");
    startDesktopApp(() => {
      throw error;
    });
    expect(mocks.failStartup).toHaveBeenCalledWith(error);
  });
  it("migrates a Mago Local profile before taking the single-instance lock", () => {
    mocks.requestSingleInstanceLock.mockImplementation(() => {
      expect(mocks.migrateLegacyProfile).toHaveBeenCalledWith({
        appDataPath: "/appData",
        userDataPath: "/userData"
      });
      return true;
    });
    startDesktopApp(vi.fn());
    expect(mocks.setPath).not.toHaveBeenCalled();
  });
  it("keeps using the old profile when the migration could not move it", () => {
    mocks.migrateLegacyProfile.mockReturnValue("/appData/Mago Local");
    startDesktopApp(vi.fn());
    expect(mocks.setPath).toHaveBeenCalledWith(
      "userData",
      "/appData/Mago Local"
    );
  });
  it("never migrates during an installer run", () => {
    mocks.handleInstallerStartup.mockReturnValue(true);
    startDesktopApp(vi.fn());
    expect(mocks.migrateLegacyProfile).not.toHaveBeenCalled();
  });
});
