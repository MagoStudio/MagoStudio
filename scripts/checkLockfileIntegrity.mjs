#!/usr/bin/env node
/**
 * Guards the two package-lock.json invariants that have silently broken
 * `npm ci` on a fresh container.
 *
 * 1. The lockfile's root "" entry mirrors package.json. A Dependabot bump left
 *    `engines` stale and moved @rollup/rollup-linux-x64-gnu into `dependencies`
 *    although package.json declares it optional; `npm ci` validates against
 *    that entry, so the desync surfaced as an unrelated "Missing: ... from lock
 *    file" error that cost two sessions their dependency install.
 *
 * 2. The `libc` constraints on platform-gated native packages survive. Losing
 *    them is bloat rather than breakage — resolution then installs the musl
 *    binaries alongside the glibc ones and vice versa — but it is pure download
 *    weight for no benefit. npm 11.9.0 stripped them on every `npm install`;
 *    npm 11.12.1 preserves them, so this guard is now a regression net rather
 *    than a daily nuisance.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const readJson = (relativePath) =>
  JSON.parse(
    readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8")
  );

const packageJson = readJson("../package.json");
const lockfile = readJson("../package-lock.json");

const MIRRORED_MANIFEST_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "engines"
];

const LIBC_ANNOTATED_ENTRY_FLOOR = 41;

const rootEntry = lockfile.packages?.[""];

const failures = [];

if (!rootEntry) {
  failures.push('package-lock.json has no root "" entry');
} else {
  for (const field of MIRRORED_MANIFEST_FIELDS) {
    const expected = JSON.stringify(packageJson[field] ?? null);
    const actual = JSON.stringify(rootEntry[field] ?? null);
    if (expected !== actual) {
      failures.push(
        `root "" entry .${field} does not mirror package.json\n` +
          `    package.json:      ${expected}\n` +
          `    package-lock.json: ${actual}`
      );
    }
  }
}

const libcAnnotatedEntries = Object.values(lockfile.packages ?? {}).filter(
  (entry) => Array.isArray(entry.libc) && entry.libc.length > 0
).length;

if (libcAnnotatedEntries < LIBC_ANNOTATED_ENTRY_FLOOR) {
  failures.push(
    `only ${libcAnnotatedEntries} lockfile entries carry a libc constraint, expected at least ${LIBC_ANNOTATED_ENTRY_FLOOR}.\n` +
      `    npm 11.9.0 stripped these on every \`npm install\`; if you are on it, upgrade.\n` +
      `    Otherwise restore them with\n` +
      `    \`git checkout -- package-lock.json\` and hand-edit the change you actually wanted,\n` +
      `    or lower LIBC_ANNOTATED_ENTRY_FLOOR if dependencies genuinely dropped native binaries.`
  );
}

if (failures.length > 0) {
  console.error("package-lock.json integrity check failed:\n");
  for (const failure of failures) console.error(`  - ${failure}\n`);
  process.exit(1);
}

console.log(
  `package-lock.json integrity OK (root entry mirrors package.json, ${libcAnnotatedEntries} libc-annotated entries)`
);
