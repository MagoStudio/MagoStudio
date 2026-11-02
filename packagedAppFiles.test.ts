import { describe, expect, it } from "vitest";

import { isExcludedFromPackagedApp } from "./packagedAppFiles";

describe("isExcludedFromPackagedApp", () => {
  it.each([
    "",
    "/package.json",
    "/desktop-dist",
    "/desktop-dist/main/main.js",
    "/desktop-dist/shared/cloud.generated.json",
    "/out",
    "/out/index.html",
    "/out/_next/static/chunks/app.js",
    "/node_modules",
    "/node_modules/zod/index.js"
  ])("packs %s", (packagedPath) => {
    expect(isExcludedFromPackagedApp(packagedPath)).toBe(false);
  });

  it.each([
    "/.vscode/settings.json",
    "/.github/workflows/ci.yml",
    "/.env.local",
    "/README.md",
    "/docs-public/architecture.md",
    "/src/app/page.tsx",
    "/public/logo.svg",
    "/tsconfig.tsbuildinfo",
    "/package-lock.json",
    "/desktop-dist-backup/main.js",
    "/outside/index.html"
  ])("leaves out %s", (packagedPath) => {
    expect(isExcludedFromPackagedApp(packagedPath)).toBe(true);
  });

  it.each([
    "/desktop-dist/main/deepLink.test.js",
    "/desktop-dist/main/deepLink.js.map",
    "/desktop-dist/main/deepLink.test.js.map",
    "/desktop-dist/main/scriptProjects/videoPrompt/videoPromptParity.fixtures.json"
  ])("leaves out the test-only desktop file %s", (packagedPath) => {
    expect(isExcludedFromPackagedApp(packagedPath)).toBe(true);
  });

  it("leaves out node modules the main process does not need", () => {
    expect(isExcludedFromPackagedApp("/node_modules/react/index.js")).toBe(
      true
    );
  });
});
