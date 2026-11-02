import { execFile } from "node:child_process";
import { totalmem } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import type { LocalSetupHardwareReport } from "../../shared/contracts";

import {
  buildMultiGpuReport,
  mergeGraphicsCards,
  parseNvidiaCards,
  parseWindowsCards,
  type GraphicsCard
} from "./graphicsCards";
import { parseVideoMemory } from "./resolveHardwareVerdict";
const run = promisify(execFile);
const PROBE_TIMEOUT_MS = 10_000;
const readCommand = async (
  file: string,
  args: string[]
): Promise<string | null> => {
  try {
    return (
      await run(file, args, { timeout: PROBE_TIMEOUT_MS, windowsHide: true })
    ).stdout;
  } catch {
    return null;
  }
};
const probeNvidia = async () => {
  const args = [
    "--query-gpu=name,memory.total",
    "--format=csv,noheader,nounits"
  ];
  let output = await readCommand("nvidia-smi", args);
  if (!output && process.platform === "win32")
    output = await readCommand(
      path.join(
        process.env.ProgramW6432 ?? "C:\\Program Files",
        "NVIDIA Corporation",
        "NVSMI",
        "nvidia-smi.exe"
      ),
      args
    );
  return parseNvidiaCards(output);
};
const probeWindows = async () =>
  parseWindowsCards(
    await readCommand("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `
$adapters = Get-CimInstance Win32_VideoController
$entries = Get-ChildItem -LiteralPath 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}' -ErrorAction SilentlyContinue | Get-ItemProperty -ErrorAction SilentlyContinue
@($adapters | ForEach-Object {
  $adapter = $_
  $entry = $entries | Where-Object { $_.DriverDesc -eq $adapter.Name } | Select-Object -First 1
  [PSCustomObject]@{ Name = $adapter.Name; DedicatedBytes = $entry.'HardwareInformation.qwMemorySize' }
}) | ConvertTo-Json -Compress
`
    ])
  );
const probeMac = async (): Promise<GraphicsCard[]> => {
  try {
    const output = await readCommand("system_profiler", [
      "SPDisplaysDataType",
      "-json"
    ]);
    const displays = JSON.parse(output ?? "{}").SPDisplaysDataType;
    if (!Array.isArray(displays)) return [];
    return displays.map((card) => ({
      graphicsCardName: card.sppci_model ?? "Unknown",
      videoMemoryBytes: parseVideoMemory(
        card.spdisplays_vram ?? card._spdisplays_vramActive ?? null
      ),
      sharedOnly: /shared|dynamic/i.test(card.spdisplays_vram ?? "")
    }));
  } catch {
    return [];
  }
};
export const probeHardware = async (): Promise<LocalSetupHardwareReport> => {
  if (process.platform === "darwin")
    return buildMultiGpuReport(await probeMac(), totalmem());
  const [nvidia, fallback] = await Promise.all([
    probeNvidia(),
    process.platform === "win32"
      ? probeWindows()
      : readCommand("lspci", []).then((output) =>
          (output ?? "")
            .split(/\r?\n/)
            .filter((line) =>
              /VGA compatible controller|3D controller|Display controller/i.test(
                line
              )
            )
            .map((line) => ({
              graphicsCardName: line.replace(
                /^.*?(?:VGA compatible controller|3D controller|Display controller):\s*/i,
                ""
              ),
              videoMemoryBytes: null
            }))
        )
  ]);
  // lspci adds vendor prefixes to NVIDIA names; nvidia-smi already enumerates
  // every NVIDIA device with authoritative dedicated memory.
  const fallbackCards =
    process.platform !== "win32" && nvidia.length
      ? fallback.filter((card) => !/nvidia/i.test(card.graphicsCardName))
      : fallback;
  return buildMultiGpuReport(
    mergeGraphicsCards(nvidia, fallbackCards),
    totalmem()
  );
};
