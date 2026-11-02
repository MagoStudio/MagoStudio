import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const electronPath = require("electron");
const nextPath = require.resolve("next/dist/bin/next");
const projectRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const npmExecPath = process.env.npm_execpath;
const isStaging = process.argv.includes("--staging");
const PRODUCTION_RENDERER_PORT = 3000;
const STAGING_RENDERER_PORT = 3001;
const rendererPort = isStaging
  ? STAGING_RENDERER_PORT
  : PRODUCTION_RENDERER_PORT;
const rendererUrl = `http://127.0.0.1:${rendererPort}`;
const hotReloadUrl = `ws://127.0.0.1:${rendererPort}/_next/hmr?id=desktop-readiness`;
const rendererPollAttempts = 120;
const rendererPollIntervalMs = 500;
const hotReloadPollTimeoutMs = 1_000;

// Staging uses a separate Clerk development instance and backend. The desktop
// main process puts this Next server behind the same pinned HTTPS renderer
// origin used by packaged builds, so either cloud target gets the origin it
// expects without giving up hot reload. Neither value here is a secret:
// publishable keys and API base URLs both ship in the public web bundle.
const STAGING_CLERK_PUBLISHABLE_KEY =
  "pk_test_ZGVjaWRpbmctYm94ZXItMzUuY2xlcmsuYWNjb3VudHMuZGV2JA";
const STAGING_BACKEND_URL = "https://staging.app.mago.studio/api/v02";
const STAGING_CLOUD_STORAGE_HOSTS = [
  "mago-s3-test.s3.eu-north-1.amazonaws.com",
  "mago-s3-test.s3.amazonaws.com",
  "mago-app-development.s3.eu-north-1.amazonaws.com",
  "mago-app-development.s3.amazonaws.com"
];

if (isStaging) {
  process.env.MAGO_CLERK_PUBLISHABLE_KEY ??= STAGING_CLERK_PUBLISHABLE_KEY;
  process.env.MAGO_BACKEND_URL ??= STAGING_BACKEND_URL;
  process.env.MAGO_CLOUD_STORAGE_HOSTS ??=
    STAGING_CLOUD_STORAGE_HOSTS.join(",");
}

// This script never runs a packaged build, so a stray MAGO_PACKAGED_SMOKE=1
// left over in the shell (e.g. from testing against the packaged renderer
// origin) would otherwise send DatabaseManager looking for migrations at the
// packaged-build layout, which doesn't exist here -- "Can't find meta/_journal.json".
delete process.env.MAGO_PACKAGED_SMOKE;

// DatabaseManager falls back to path.join(app.getAppPath(), "desktop", "main",
// "database", "migrations") in dev, but Electron resolves getAppPath() to the
// entry script's own directory (desktop-dist/main) when launched by explicit
// file path rather than a directory -- not the project root the fallback
// assumes. Point it at the real migrations folder directly rather than relying
// on that resolution.
process.env.MAGO_MIGRATIONS_PATH ??= path.join(
  projectRoot,
  "desktop",
  "main",
  "database",
  "migrations"
);

const run = (command, args, options = {}) =>
  spawn(command, args, {
    stdio: "inherit",
    shell: false,
    ...options
  });

// Windows cannot execute .cmd shims with shell:false on newer Node versions.
// npm exposes the JavaScript CLI path to lifecycle scripts, so invoke that
// with the current Node executable and keep shell execution disabled.
const runNpm = (args) => {
  if (npmExecPath) return run(process.execPath, [npmExecPath, ...args]);
  return run(process.platform === "win32" ? "npm.cmd" : "npm", args, {
    shell: process.platform === "win32"
  });
};

const assertRendererPortAvailable = () =>
  new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", (error) => {
      reject(
        new Error(
          `Desktop renderer port ${rendererPort} is already in use; stop the existing dev server before starting this environment`,
          { cause: error }
        )
      );
    });
    probe.listen(rendererPort, "127.0.0.1", () => probe.close(resolve));
  });

await assertRendererPortAvailable();

// Spawn Next directly so stopping this script terminates the server itself on
// Windows instead of only killing an npm wrapper and leaving an orphan behind.
const web = run(process.execPath, [
  nextPath,
  "dev",
  "-p",
  String(rendererPort)
]);
let webExitCode;
web.once("exit", (exitCode) => {
  webExitCode = exitCode ?? 1;
});

const hotReloadIsReady = () =>
  new Promise((resolve) => {
    const socket = new WebSocket(hotReloadUrl);
    let settled = false;
    const finish = (ready) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.close();
      resolve(ready);
    };
    const timeout = setTimeout(() => finish(false), hotReloadPollTimeoutMs);
    socket.addEventListener("open", () => finish(true), { once: true });
    socket.addEventListener("error", () => finish(false), { once: true });
    socket.addEventListener("close", () => finish(false), { once: true });
  });

const waitForRenderer = async () => {
  for (let attempt = 0; attempt < rendererPollAttempts; attempt += 1) {
    if (webExitCode !== undefined) {
      throw new Error(
        `The Next.js development server exited before becoming ready (exit code ${webExitCode})`
      );
    }
    try {
      const response = await fetch(rendererUrl);
      if (response.ok && (await hotReloadIsReady())) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, rendererPollIntervalMs));
  }
  throw new Error("The Next.js development server did not become ready");
};

let desktop;
const stop = () => {
  desktop?.kill();
  web.kill();
};

process.once("SIGINT", stop);
process.once("SIGTERM", stop);

try {
  await waitForRenderer();
  // Loading next.config writes cloud.generated.json using this run's target
  // (production or --staging). Build the main process afterwards so
  // copyCloudConfig cannot copy a stale config from an earlier environment.
  const build = runNpm(["run", "build:desktop"]);
  const buildExitCode = await new Promise((resolve) =>
    build.once("exit", resolve)
  );
  if (buildExitCode !== 0)
    throw new Error(`Desktop build failed with exit code ${buildExitCode}`);

  desktop = run(electronPath, ["desktop-dist/main/main.js"], {
    env: { ...process.env, MAGO_RENDERER_URL: rendererUrl }
  });
  const exitCode = await new Promise((resolve) =>
    desktop.once("exit", resolve)
  );
  stop();
  process.exit(exitCode ?? 0);
} catch (error) {
  console.error(error);
  stop();
  process.exit(1);
}
