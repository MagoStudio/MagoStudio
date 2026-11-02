/* oxlint-disable eslint/no-control-regex -- reject control characters in ZIP paths */
/* oxlint-disable eslint/no-magic-numbers -- ZIP record offsets and safety limits */
import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { crc32 } from "node:zlib";

import { unzipSync } from "fflate";

const MAX_ARCHIVE_BYTES = 256 * 1024 * 1024;
const MAX_EXTRACTED_BYTES = 512 * 1024 * 1024;

export const extractNodePack = async (
  archive: string,
  destination: string,
  stripRoot = true
): Promise<void> => {
  if (await stat(destination).catch(() => null))
    throw new Error(
      "The node pack folder already exists. Move it aside before installing; existing files were preserved."
    );
  if ((await stat(archive)).size > MAX_ARCHIVE_BYTES)
    throw new Error(
      "Node ZIP is too large for automatic extraction. Extract it manually."
    );
  const bytes = await readFile(archive);
  let end = bytes.length - 22;
  while (
    end >= Math.max(0, bytes.length - 65557) &&
    (bytes.readUInt32LE(end) !== 0x06054b50 ||
      end + 22 + bytes.readUInt16LE(end + 20) !== bytes.length)
  )
    end--;
  if (end < Math.max(0, bytes.length - 65557))
    throw new Error("Invalid ZIP archive.");
  const count = bytes.readUInt16LE(end + 10);
  let cursor = bytes.readUInt32LE(end + 16);
  if (
    bytes.readUInt16LE(end + 4) ||
    bytes.readUInt16LE(end + 6) ||
    count === 65535
  )
    throw new Error("Unsupported ZIP format. Extract manually.");
  const expected = new Map<string, { crc: number; size: number }>();
  const names = new Set<string>();
  let total = 0;
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > bytes.length || bytes.readUInt32LE(cursor) !== 0x02014b50)
      throw new Error("Invalid ZIP directory.");
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const name = bytes
      .subarray(cursor + 46, cursor + 46 + nameLength)
      .toString("utf8");
    const mode = bytes.readUInt32LE(cursor + 38) >>> 16;
    const parts = name.replace(/\/$/, "").split("/");
    if (
      !name ||
      name.includes("\\") ||
      parts.some(
        (part) =>
          !part ||
          part === "." ||
          part === ".." ||
          /[:\x00-\x1f]/.test(part) ||
          /[. ]$/.test(part) ||
          /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)
      ) ||
      (mode & 0xf000) === 0xa000 ||
      names.has(name.toLowerCase())
    )
      throw new Error("Unsafe path or link in node ZIP.");
    names.add(name.toLowerCase());
    const size = bytes.readUInt32LE(cursor + 24);
    total += size;
    if (total > MAX_EXTRACTED_BYTES)
      throw new Error("Expanded node ZIP is too large. Extract manually.");
    expected.set(name, { crc: bytes.readUInt32LE(cursor + 16), size });
    cursor +=
      46 +
      nameLength +
      bytes.readUInt16LE(cursor + 30) +
      bytes.readUInt16LE(cursor + 32);
  }
  const roots = new Set([...expected.keys()].map((name) => name.split("/")[0]));
  if (
    stripRoot &&
    (roots.size !== 1 ||
      ![...expected.keys()].some((name) => name.includes("/")))
  )
    throw new Error("Expected a ZIP containing one node pack folder.");
  const files = unzipSync(bytes, {
    filter: (file) => {
      const entry = expected.get(file.name);
      if (!entry || file.originalSize !== entry.size)
        throw new Error("ZIP entry size mismatch.");
      return true;
    }
  });
  for (const [name, entry] of expected) {
    const data = files[name];
    if (!data || data.length !== entry.size || crc32(data) !== entry.crc)
      throw new Error(
        "ZIP CRC verification failed. Download the archive again."
      );
  }
  const staging = await mkdtemp(
    path.join(path.dirname(destination), ".mago-extract-")
  );
  try {
    for (const [name, data] of Object.entries(files)) {
      const relative = stripRoot ? name.split("/").slice(1).join("/") : name;
      if (!relative) continue;
      const output = path.resolve(staging, relative);
      if (!output.startsWith(staging + path.sep))
        throw new Error("Unsafe ZIP path.");
      if (name.endsWith("/")) await mkdir(output, { recursive: true });
      else {
        await mkdir(path.dirname(output), { recursive: true });
        await writeFile(output, data, { flag: "wx" });
      }
    }
    if (await stat(destination).catch(() => null))
      throw new Error("The node folder already exists.");
    await rename(staging, destination);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
};
