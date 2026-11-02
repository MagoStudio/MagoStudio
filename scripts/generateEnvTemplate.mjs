#!/usr/bin/env node
/**
 * Regenerates .env.local.template from your local .env.local, so a variable
 * added locally cannot silently stay undocumented for everyone else (a cloud
 * sandbox provisions its .env.local from this template).
 *
 * Only variable NAMES are copied. Values never leave .env.local.
 *
 *   node scripts/generateEnvTemplate.mjs           # rewrite the template
 *   node scripts/generateEnvTemplate.mjs --check   # exit 1 if it is stale
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const resolve = (relativePath) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

const ENV_LOCAL_PATH = resolve("../.env.local");
const TEMPLATE_PATH = resolve("../.env.local.template");

const isCheckOnly = process.argv.includes("--check");

const parseVariableNames = (contents) => {
  const names = [];
  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;
    const name = line
      .slice(0, separatorIndex)
      .replace(/^export\s+/, "")
      .trim();
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
};

const readNames = (path) =>
  existsSync(path) ? parseVariableNames(readFileSync(path, "utf8")) : [];

if (!existsSync(ENV_LOCAL_PATH)) {
  console.error(
    ".env.local not found — nothing to generate from. Copy .env.local.template to .env.local and fill it in first."
  );
  process.exit(1);
}

const localNames = readNames(ENV_LOCAL_PATH);
const templateNames = readNames(TEMPLATE_PATH);

const retiredNames = templateNames.filter((name) => !localNames.includes(name));
const newNames = localNames.filter((name) => !templateNames.includes(name));

const mergedNames = [...localNames, ...retiredNames];
const nextTemplate = mergedNames.map((name) => `${name}=`).join("\n") + "\n";
const currentTemplate = existsSync(TEMPLATE_PATH)
  ? readFileSync(TEMPLATE_PATH, "utf8")
  : "";

for (const name of newNames) {
  console.log(`+ ${name} — in your .env.local, missing from the template`);
}
for (const name of retiredNames) {
  console.log(
    `? ${name} — in the template, absent from your .env.local (kept; delete it by hand if it is genuinely retired)`
  );
}

if (nextTemplate === currentTemplate) {
  console.log(".env.local.template is up to date");
  process.exit(0);
}

if (isCheckOnly) {
  console.error(
    "\n.env.local.template is stale — run `npm run env:template` and commit the result."
  );
  process.exit(1);
}

writeFileSync(TEMPLATE_PATH, nextTemplate);
console.log(`\nwrote .env.local.template (${mergedNames.length} variables)`);
