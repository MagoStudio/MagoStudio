import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { migrateLegacyProfile } from "./migrateLegacyProfile";

let appDataPath: string;
let legacyUserDataPath: string;
let userDataPath: string;

const writeLegacySettings = (settings: Record<string, unknown>) =>
  writeFileSync(
    path.join(legacyUserDataPath, "settings.json"),
    JSON.stringify(settings)
  );

const readSettings = () =>
  JSON.parse(readFileSync(path.join(userDataPath, "settings.json"), "utf8"));

beforeEach(() => {
  appDataPath = mkdtempSync(path.join(tmpdir(), "profile-migration-"));
  legacyUserDataPath = path.join(appDataPath, "Mago Local");
  userDataPath = path.join(appDataPath, "Mago Studio");
});

afterEach(() => rmSync(appDataPath, { recursive: true, force: true }));

describe("migrateLegacyProfile", () => {
  it("leaves a fresh install alone", () => {
    expect(migrateLegacyProfile({ appDataPath, userDataPath })).toBe(
      userDataPath
    );
    expect(existsSync(userDataPath)).toBe(false);
  });

  it("moves the Mago Local profile and its default library to the Mago Studio names", () => {
    mkdirSync(path.join(legacyUserDataPath, "MagoLocal", "assets"), {
      recursive: true
    });
    writeLegacySettings({
      appMode: "cloud",
      libraryRoot: path.join(legacyUserDataPath, "MagoLocal")
    });

    expect(migrateLegacyProfile({ appDataPath, userDataPath })).toBe(
      userDataPath
    );

    expect(existsSync(legacyUserDataPath)).toBe(false);
    expect(existsSync(path.join(userDataPath, "MagoStudio", "assets"))).toBe(
      true
    );
    expect(readSettings()).toEqual({
      appMode: "cloud",
      libraryRoot: path.join(userDataPath, "MagoStudio")
    });
  });

  it("keeps a library path the user chose outside the profile", () => {
    mkdirSync(legacyUserDataPath, { recursive: true });
    const chosenLibraryRoot = path.join(appDataPath, "elsewhere", "Library");
    writeLegacySettings({ libraryRoot: chosenLibraryRoot });

    migrateLegacyProfile({ appDataPath, userDataPath });

    expect(readSettings().libraryRoot).toBe(chosenLibraryRoot);
  });

  it("replaces an empty Mago Studio folder that Electron created early", () => {
    mkdirSync(legacyUserDataPath, { recursive: true });
    mkdirSync(userDataPath, { recursive: true });
    writeLegacySettings({ appMode: "offline" });

    migrateLegacyProfile({ appDataPath, userDataPath });

    expect(readSettings()).toEqual({ appMode: "offline" });
  });

  it("never touches a Mago Studio profile that already holds data", () => {
    mkdirSync(legacyUserDataPath, { recursive: true });
    mkdirSync(userDataPath, { recursive: true });
    writeFileSync(path.join(userDataPath, "settings.json"), "{}");

    expect(migrateLegacyProfile({ appDataPath, userDataPath })).toBe(
      userDataPath
    );
    expect(existsSync(legacyUserDataPath)).toBe(true);
  });

  it("keeps using the old profile when it cannot be moved, so nothing is lost", () => {
    mkdirSync(legacyUserDataPath, { recursive: true });

    const resolvedUserDataPath = migrateLegacyProfile({
      appDataPath,
      userDataPath,
      fileSystem: {
        exists: existsSync,
        isEmptyDirectory: () => true,
        removeEmptyDirectory: () => {},
        rename: () => {
          throw new Error("EBUSY: the old app still holds the folder");
        },
        readText: () => "{}",
        writeText: () => {}
      }
    });

    expect(resolvedUserDataPath).toBe(legacyUserDataPath);
    expect(existsSync(legacyUserDataPath)).toBe(true);
  });
});
