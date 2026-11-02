import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const run = promisify(execFile);

// Use a harmless embedded executable rather than installing the app during tests.
describe.skipIf(process.platform !== "win32")(
  "Windows installer launcher",
  () => {
    let directory: string;
    let launcher: string;
    let result: string;
    beforeAll(async () => {
      directory = await mkdtemp(path.join(tmpdir(), "mago-launcher-test-"));
      launcher = path.join(directory, "Test Setup.exe");
      result = path.join(directory, "arguments.txt");
      const source = path.join(directory, "Payload.cs");
      await writeFile(
        source,
        `
using System;
using System.IO;
using System.Linq;
internal static class Payload {
    private static int Main(string[] args) {
        File.WriteAllLines(Environment.GetEnvironmentVariable("MAGO_INSTALLER_SMOKE_RESULT"), args);
        return args.Contains("--fail") ? 7 : 0;
    }
}`
      );
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
        `/out:${launcher}`,
        source
      ]);
      const environment = { ...process.env };
      delete environment.MAGO_SIGNTOOL_PATH;
      delete environment.MAGO_SIGNING_DLIB_PATH;
      delete environment.MAGO_SIGNING_METADATA_PATH;
      await run(
        process.execPath,
        ["scripts/wrapWindowsInstaller.mjs", launcher],
        {
          env: environment,
          windowsHide: true
        }
      );
    }, 60_000);
    afterAll(async () => {
      if (directory) await rm(directory, { recursive: true, force: true });
    });
    it("extracts and runs the payload silently while preserving quoted arguments", async () => {
      const args = [
        "--silent",
        "two words",
        'quoted"value',
        "C:\\folder with spaces\\",
        ""
      ];
      await run(launcher, args, {
        env: { ...process.env, MAGO_INSTALLER_SMOKE_RESULT: result },
        windowsHide: true
      });
      expect(
        (await readFile(result, "utf8")).split(/\r?\n/).slice(0, -1)
      ).toEqual(args);
    });
    it("propagates installation failures without launching the app", async () => {
      await expect(
        run(launcher, ["--silent", "--fail"], {
          env: { ...process.env, MAGO_INSTALLER_SMOKE_RESULT: result },
          windowsHide: true
        })
      ).rejects.toMatchObject({ code: 7 });
    });
  }
);
