import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

/**
 * Copies the build-resolved cloud config next to the compiled main process.
 *
 * The Next build writes desktop/shared/cloud.generated.json so the main process
 * serves a CSP that matches the bundle. tsc does not copy it, because it is read
 * at runtime rather than imported, so it is copied here.
 */
const source = path.resolve("desktop/shared/cloud.generated.json");
const targetDirectory = path.resolve("desktop-dist/shared");

if (!existsSync(source)) {
  console.log("no cloud.generated.json yet; run the web build first");
  process.exit(0);
}
mkdirSync(targetDirectory, { recursive: true });
copyFileSync(source, path.join(targetDirectory, "cloud.generated.json"));
console.log("copied cloud.generated.json to desktop-dist/shared");
