import { buildNodeModulesIgnorePattern } from "./packagedNodeModules";

const packagedTopLevelEntries = [
  "package.json",
  "desktop-dist",
  "out",
  "node_modules"
];

const desktopDistTestOnlyFile =
  /^\/desktop-dist\/.*(?:\.test\.js|\.map|\.fixtures\.json)$/;

const unpackagedNodeModulePath = buildNodeModulesIgnorePattern();

export const isExcludedFromPackagedApp = (packagedPath: string) => {
  const isAppRoot = packagedPath === "";
  if (isAppRoot) return false;
  const topLevelEntry = packagedPath.split("/")[1];
  if (!packagedTopLevelEntries.includes(topLevelEntry)) return true;
  return (
    unpackagedNodeModulePath.test(packagedPath) ||
    desktopDistTestOnlyFile.test(packagedPath)
  );
};
