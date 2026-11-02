import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import type { ForgeConfig } from "@electron-forge/shared-types";

import { isExcludedFromPackagedApp } from "./packagedAppFiles";

// Azure Artifact Signing (formerly Trusted Signing). CI sets these three paths;
// without them the build stays unsigned. The hook signs one file at a time with
// retries.
function getWindowsSignOptions() {
  const {
    MAGO_SIGNTOOL_PATH,
    MAGO_SIGNING_DLIB_PATH,
    MAGO_SIGNING_METADATA_PATH
  } = process.env;
  if (
    !MAGO_SIGNTOOL_PATH ||
    !MAGO_SIGNING_DLIB_PATH ||
    !MAGO_SIGNING_METADATA_PATH
  ) {
    return undefined;
  }
  return { hookModulePath: path.resolve("scripts/windowsSignHook.cjs") };
}

const windowsSign = getWindowsSignOptions();

function getMacSignOptions() {
  const { MAGO_APPLE_SIGNING_IDENTITY, MAGO_APPLE_KEYCHAIN_PATH } = process.env;
  if (!MAGO_APPLE_SIGNING_IDENTITY || !MAGO_APPLE_KEYCHAIN_PATH) {
    return undefined;
  }
  return {
    identity: MAGO_APPLE_SIGNING_IDENTITY,
    keychain: MAGO_APPLE_KEYCHAIN_PATH
  };
}

function getMacNotarizeOptions() {
  const {
    MAGO_APPLE_API_KEY_PATH,
    MAGO_APPLE_API_KEY_ID,
    MAGO_APPLE_API_ISSUER
  } = process.env;
  if (
    !MAGO_APPLE_API_KEY_PATH ||
    !MAGO_APPLE_API_KEY_ID ||
    !MAGO_APPLE_API_ISSUER
  ) {
    return undefined;
  }
  return {
    appleApiKey: MAGO_APPLE_API_KEY_PATH,
    appleApiKeyId: MAGO_APPLE_API_KEY_ID,
    appleApiIssuer: MAGO_APPLE_API_ISSUER
  };
}

const macSign = getMacSignOptions();
const macNotarize = macSign ? getMacNotarizeOptions() : undefined;

const config: ForgeConfig = {
  outDir: process.env.MAGO_FORGE_OUT_DIR || "release",
  packagerConfig: {
    asar: { unpack: "**/node_modules/ffmpeg-static/**" },
    executableName: "mago-studio",
    icon: "desktop/icons/icon",
    windowsSign,
    osxSign: macSign,
    osxNotarize: macNotarize,
    extraResource: ["desktop/main/database/migrations", "LICENSE", "NOTICE.md"],
    prune: false,
    ignore: isExcludedFromPackagedApp
  },
  rebuildConfig: {},
  hooks: {
    postMake: async (_config, results) => {
      if (process.platform !== "win32") return results;
      const installers = results
        .flatMap((result) => result.artifacts)
        .filter((artifact) => artifact.endsWith(" Setup.exe"));
      if (installers.length > 0) {
        const { stdout } = await promisify(execFile)(process.execPath, [
          "scripts/wrapWindowsInstaller.mjs",
          ...installers
        ]);
        process.stdout.write(stdout);
      }
      return results;
    }
  },
  makers: [
    new MakerSquirrel(
      {
        name: "MagoStudio",
        authors: "Mago",
        description: "Local-first desktop edition of Mago",
        loadingGif: "build-assets/installer-splash.gif",
        setupIcon: "desktop/icons/icon.ico",
        windowsSign
      },
      ["win32"]
    ),
    new MakerDMG({ icon: "desktop/icons/icon.icns" }, ["darwin"]),
    new MakerZIP({}, ["darwin", "linux"]),
    new MakerDeb({ options: { icon: "desktop/icons/icon.png" } }, ["linux"])
  ]
};

export default config;
