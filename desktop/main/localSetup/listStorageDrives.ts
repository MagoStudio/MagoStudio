import { execFile } from "node:child_process";
import { readdir, readFile, statfs } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import type { LocalSetupStorageDrive } from "../../shared/contracts";

import { BYTES_PER_GIGABYTE } from "./resolveHardwareVerdict";
const run = promisify(execFile);
const TIMEOUT_MS = 10_000;
type Volume = { rootPath: string; name: string };
export const parseWindowsVolumes = (output: string): Volume[] => {
  const parsed: unknown = JSON.parse(output);
  const rows = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
  return rows.flatMap((row) => {
    if (
      !row ||
      typeof row.DeviceID !== "string" ||
      !/^[A-Z]:$/i.test(row.DeviceID)
    )
      return [];
    const label =
      typeof row.VolumeName === "string" && row.VolumeName.trim()
        ? row.VolumeName.trim()
        : "Drive";
    return [
      { rootPath: row.DeviceID + "\\", name: `${label} (${row.DeviceID})` }
    ];
  });
};
export const parseLinuxVolumes = (output: string): Volume[] => {
  const devices = new Set<string>();
  const result: Volume[] = [];
  const decode = (text: string) =>
    text.replace(/\\([0-7]{3})/g, (_, octal: string) =>
      String.fromCharCode(parseInt(octal, 8))
    );
  for (const line of output.split("\n")) {
    const [mount, details] = line.split(" - ");
    if (!details) continue;
    const fields = mount.split(" ");
    const source = details.split(" ")[1];
    const rootPath = decode(fields[4] ?? "");
    if (
      !source?.startsWith("/dev/") ||
      !rootPath.startsWith("/") ||
      /^\/(boot|snap)(\/|$)/.test(rootPath) ||
      devices.has(fields[2])
    )
      continue;
    if (!fields[5]?.split(",").includes("rw")) continue;
    devices.add(fields[2]);
    result.push({
      rootPath,
      name: rootPath === "/" ? "System drive (/)" : rootPath
    });
  }
  return result;
};
export const readStorageSpace = async (
  folderPath: string
): Promise<number | null> => {
  try {
    const space = await statfs(folderPath);
    return (Number(space.bavail) * Number(space.bsize)) / BYTES_PER_GIGABYTE;
  } catch {
    return null;
  }
};
export const listStorageDrives = async (): Promise<
  LocalSetupStorageDrive[]
> => {
  let volumes: Volume[];
  if (process.platform === "win32") {
    const { stdout } = await run(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "[System.IO.DriveInfo]::GetDrives() | Where-Object { $_.IsReady -and [int]$_.DriveType -in 2,3,4 } | ForEach-Object { [PSCustomObject]@{ DeviceID = $_.Name.Substring(0,2); VolumeName = $_.VolumeLabel } } | ConvertTo-Json -Compress"
      ],
      { timeout: TIMEOUT_MS, windowsHide: true }
    );
    volumes = parseWindowsVolumes(stdout);
  } else if (process.platform === "darwin") {
    const entries = await readdir("/Volumes", { withFileTypes: true });
    volumes = entries
      .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
      .map((entry) => ({
        rootPath: path.join("/Volumes", entry.name),
        name: entry.name
      }));
    if (!volumes.length)
      volumes = [{ rootPath: "/", name: "System drive (/)" }];
  } else {
    volumes = parseLinuxVolumes(await readFile("/proc/self/mountinfo", "utf8"));
  }
  return Promise.all(
    volumes.map(async (volume) => ({
      ...volume,
      id: volume.rootPath,
      freeGigabytes: await readStorageSpace(volume.rootPath)
    }))
  );
};
