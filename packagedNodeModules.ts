export const packagedNodeModuleNames = [
  "drizzle-orm",
  "fflate",
  "ffmpeg-static",
  "zod"
];

const escapeForRegularExpression = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toPackagedDirectoryName = (moduleName: string) =>
  moduleName.startsWith("@") ? moduleName.split("/")[0] : moduleName;

export const buildNodeModulesIgnorePattern = () => {
  const packagedDirectoryNames = [
    ...new Set(packagedNodeModuleNames.map(toPackagedDirectoryName))
  ];
  const allowedDirectories = packagedDirectoryNames
    .map((name) => `${escapeForRegularExpression(name)}(?:\\/|$)`)
    .join("|");
  return new RegExp(`^\\/node_modules\\/(?!${allowedDirectories})`);
};
