import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export const extractStarterArchive = async (
  archive: string,
  staging: string,
  signal: AbortSignal
): Promise<void> => {
  // Windows PowerShell targets an older .NET Framework. Opt into modern path
  // handling and use extended paths so extraction does not require a registry change.
  const script = String.raw`$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[AppContext]::SetSwitch('Switch.System.IO.UseLegacyPathHandling', $false)
[AppContext]::SetSwitch('Switch.System.IO.BlockLongPaths', $false)
try {
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $archive = [System.IO.Compression.ZipFile]::OpenRead($env:MAGO_INSTALL_ARCHIVE)
  try {
    $root = [System.IO.Path]::GetFullPath($env:MAGO_INSTALL_STAGE) + [System.IO.Path]::DirectorySeparatorChar
    foreach ($entry in $archive.Entries) {
      $name = $entry.FullName.Replace('/', '\')
      if ($name.Split('\') -contains '..' -or $name.Contains(':') -or [System.IO.Path]::IsPathRooted($name)) { throw 'Unsafe archive path' }
      $target = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $name))
      if (-not $target.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe archive path' }
    }
    foreach ($entry in $archive.Entries) {
      $target = [System.IO.Path]::Combine($root, $entry.FullName.Replace('/', '\'))
      if ($target.EndsWith('\')) {
        [System.IO.Directory]::CreateDirectory($target) | Out-Null
      } else {
        [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($target)) | Out-Null
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target)
      }
    }
  } finally { $archive.Dispose() }
} catch {
  [Console]::Error.WriteLine($_.Exception.GetBaseException().Message)
  exit 1
}`;
  try {
    await run(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-EncodedCommand",
        Buffer.from(script, "utf16le").toString("base64")
      ],
      {
        windowsHide: true,
        signal,
        env: {
          ...process.env,
          MAGO_INSTALL_ARCHIVE: path.toNamespacedPath(archive),
          MAGO_INSTALL_STAGE: path.toNamespacedPath(staging)
        }
      }
    );
  } catch (error) {
    signal.throwIfAborted();
    const stderr = (error as { stderr?: string }).stderr?.trim();
    throw new Error(
      `Could not extract the ComfyUI bundle. ${stderr || "Retry the installation."}`,
      { cause: error }
    );
  }
};
