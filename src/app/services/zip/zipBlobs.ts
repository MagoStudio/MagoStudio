import { zip } from "fflate";

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

export const zipBlobs = (entries: ZipEntry[]): Promise<Blob> => {
  const files: Record<string, [Uint8Array, { level: 0 }]> = {};
  const usedNames = new Set<string>();

  for (const entry of entries) {
    let name = entry.name;
    if (usedNames.has(name)) {
      const dotIndex = name.lastIndexOf(".");
      const base = dotIndex === -1 ? name : name.slice(0, dotIndex);
      const ext = dotIndex === -1 ? "" : name.slice(dotIndex);
      let counter = 1;
      do {
        name = `${base} (${counter})${ext}`;
        counter += 1;
      } while (usedNames.has(name));
    }
    usedNames.add(name);
    files[name] = [entry.data, { level: 0 }];
  }

  return new Promise<Blob>((resolve, reject) => {
    zip(files, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(new Blob([data as BlobPart], { type: "application/zip" }));
    });
  });
};
