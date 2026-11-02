import { execFile } from "node:child_process";
import {
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const require = createRequire(import.meta.url);

if (process.platform !== "win32") {
  throw new Error("The installer launcher must be built on Windows");
}

const packageManifest = JSON.parse(
  await readFile(path.resolve("package.json"), "utf8")
);
const [, numericReleaseVersion] =
  /^(\d+\.\d+\.\d+)/.exec(packageManifest.version) ?? [];
if (!numericReleaseVersion) {
  throw new Error(`Unsupported package version: ${packageManifest.version}`);
}
const escapeForCSharpString = (text) => text.replace(/[\\"]/g, "\\$&");
const launcherVersionAttributes = [
  `[assembly: System.Reflection.AssemblyTitle("${escapeForCSharpString(packageManifest.productName)} Setup")]`,
  `[assembly: System.Reflection.AssemblyProduct("${escapeForCSharpString(packageManifest.productName)}")]`,
  `[assembly: System.Reflection.AssemblyCompany("${escapeForCSharpString(packageManifest.author)}")]`,
  `[assembly: System.Reflection.AssemblyVersion("${numericReleaseVersion}.0")]`,
  `[assembly: System.Reflection.AssemblyFileVersion("${numericReleaseVersion}.0")]`,
  `[assembly: System.Reflection.AssemblyInformationalVersion("${escapeForCSharpString(packageManifest.version)}")]`
].join("\n");

for (const argument of process.argv.slice(2)) {
  const installer = path.resolve(argument);
  await stat(installer);
  const directory = await mkdtemp(
    path.join(path.dirname(installer), "launcher-build-")
  );
  try {
    const output = path.join(directory, "Setup.exe");
    const versionAttributesSource = path.join(directory, "VersionInfo.cs");
    await writeFile(versionAttributesSource, launcherVersionAttributes);
    const compiler = path.join(
      process.env.WINDIR || "C:\\Windows",
      "Microsoft.NET",
      "Framework64",
      "v4.0.30319",
      "csc.exe"
    );
    await run(compiler, [
      "/nologo",
      "/target:winexe",
      "/platform:x64",
      "/optimize+",
      `/out:${output}`,
      "/reference:System.Windows.Forms.dll",
      "/reference:System.Drawing.dll",
      `/win32icon:${path.resolve("desktop/icons/icon.ico")}`,
      `/resource:${path.resolve("desktop/icons/icon.ico")},InstallerIcon`,
      `/resource:${path.resolve("build-assets/installer-splash.gif")},InstallerSplash`,
      `/resource:${installer},InstallerPayload`,
      path.resolve("desktop/installer/SetupLauncher.cs"),
      versionAttributesSource
    ]);
    if (
      process.env.MAGO_SIGNTOOL_PATH &&
      process.env.MAGO_SIGNING_DLIB_PATH &&
      process.env.MAGO_SIGNING_METADATA_PATH
    ) {
      await require("./windowsSignHook.cjs")(output);
    }
    // Replace only after compilation and signing succeed.
    await rename(output, installer);
    console.log(`Added immediate installation window: ${installer}`);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
