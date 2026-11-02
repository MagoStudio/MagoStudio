import { spawn } from "node:child_process";

export const killProcessTree = (processId: number): Promise<void> =>
  new Promise<void>((resolve) => {
    const processTreeKiller = spawn(
      "taskkill.exe",
      ["/pid", String(processId), "/t", "/f"],
      { stdio: "ignore", windowsHide: true }
    );
    processTreeKiller.once("exit", () => resolve());
    processTreeKiller.once("error", () => resolve());
  });
