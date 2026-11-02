import fs from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildNodeModulesIgnorePattern,
  packagedNodeModuleNames
} from "./packagedNodeModules";

const repositoryRoot = __dirname;
const modulesProvidedWithoutTheirDependencies = ["electron", "ffmpeg-static"];

const collectSourceFiles = (directory: string): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(entryPath);
    const isRuntimeSource =
      /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name);
    return isRuntimeSource ? [entryPath] : [];
  });

const toPackageName = (specifier: string) => {
  const segments = specifier.split("/");
  return specifier.startsWith("@")
    ? segments.slice(0, 2).join("/")
    : segments[0];
};

const isInstalledPackage = (packageName: string) =>
  fs.existsSync(
    path.join(repositoryRoot, "node_modules", packageName, "package.json")
  );

const collectImportedPackageNames = (sourceText: string) => {
  const staticImports = sourceText.matchAll(
    /^\s*(?:import|export)\s[^;]*?from\s+["']([^"']+)["']/gm
  );
  const dynamicImports = sourceText.matchAll(/\bimport\(\s*["']([^"']+)["']/g);
  return [...staticImports, ...dynamicImports]
    .map((match) => match[1])
    .filter((specifier) => !specifier.startsWith("."))
    .filter((specifier) => !specifier.startsWith("node:"))
    .filter((specifier) => !builtinModules.includes(specifier))
    .map(toPackageName)
    .filter(isInstalledPackage);
};

const collectRuntimeDependencyClosure = (rootPackageNames: string[]) => {
  const visited = new Set<string>();
  const pending = [...rootPackageNames];
  while (pending.length > 0) {
    const packageName = pending.pop() as string;
    if (visited.has(packageName)) continue;
    visited.add(packageName);
    if (modulesProvidedWithoutTheirDependencies.includes(packageName)) continue;
    const manifest = JSON.parse(
      fs.readFileSync(
        path.join(repositoryRoot, "node_modules", packageName, "package.json"),
        "utf8"
      )
    ) as { dependencies?: Record<string, string> };
    pending.push(...Object.keys(manifest.dependencies ?? {}));
  }
  return visited;
};

describe("packaged desktop node_modules", () => {
  const mainProcessPackageNames = collectSourceFiles(
    path.join(repositoryRoot, "desktop")
  ).flatMap((sourceFile) =>
    collectImportedPackageNames(fs.readFileSync(sourceFile, "utf8"))
  );
  const requiredPackageNames = [
    ...collectRuntimeDependencyClosure([...new Set(mainProcessPackageNames)])
  ]
    .filter((packageName) => packageName !== "electron")
    .sort();

  it("finds the packages the main process imports", () => {
    expect(requiredPackageNames).toContain("drizzle-orm");
    expect(requiredPackageNames).toContain("zod");
  });

  it("lists every package the main process needs at runtime", () => {
    const packagesMissingFromPackagedApp = requiredPackageNames.filter(
      (packageName) => !packagedNodeModuleNames.includes(packageName)
    );
    expect(packagesMissingFromPackagedApp).toEqual([]);
  });

  it("does not ignore any listed package when packaging", () => {
    const ignorePattern = buildNodeModulesIgnorePattern();
    const ignoredListedPaths = packagedNodeModuleNames
      .flatMap((packageName) => {
        const parentDirectory = packageName.startsWith("@")
          ? [`/node_modules/${packageName.split("/")[0]}`]
          : [];
        return [...parentDirectory, `/node_modules/${packageName}/index.js`];
      })
      .filter((filePath) => ignorePattern.test(filePath));
    expect(ignoredListedPaths).toEqual([]);
  });

  it("still ignores packages that are not listed", () => {
    expect(
      buildNodeModulesIgnorePattern().test("/node_modules/react/index.js")
    ).toBe(true);
  });
});
