import { execFile } from "node:child_process";

export type CommandRunner = (
  command: string,
  args: string[]
) => Promise<string>;

const runCommand: CommandRunner = (command, args) =>
  new Promise((resolve, reject) =>
    execFile(command, args, { windowsHide: true }, (error, stdout) =>
      error ? reject(error) : resolve(stdout)
    )
  );

export const findListeningProcessId = async (
  port: number,
  run: CommandRunner = runCommand
): Promise<number | null> => {
  const output = await run("netstat.exe", ["-ano"]).catch(() => "");
  for (const line of output.split(/\r?\n/)) {
    const columns = line.trim().split(/\s+/);
    const [protocol, localAddress, , connectionState, processId] = columns;
    const isListeningOnPort =
      protocol === "TCP" &&
      connectionState === "LISTENING" &&
      localAddress?.endsWith(`:${port}`);
    if (isListeningOnPort && /^\d+$/.test(processId ?? ""))
      return Number(processId);
  }
  return null;
};
