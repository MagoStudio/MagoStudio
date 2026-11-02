import { FolderOrProject } from "../interface";

export const getCircularFolderIds = (items: FolderOrProject[]): string[] => {
  const folders = items.filter(
    (item) => item.type === "folder" && item.parentFolderId
  );

  const parentMap = new Map<string, string>();
  for (const folder of folders) {
    parentMap.set(folder.id, folder.parentFolderId!);
  }

  const circularIds = new Set<string>();

  for (const folder of folders) {
    if (circularIds.has(folder.id)) continue;

    const visited: string[] = [];
    const visitedSet = new Set<string>();
    let current: string | undefined = folder.id;

    while (current && parentMap.has(current)) {
      if (visitedSet.has(current)) {
        const cycleStart = visited.indexOf(current);
        for (let i = cycleStart; i < visited.length; i++) {
          circularIds.add(visited[i]);
        }
        break;
      }
      visited.push(current);
      visitedSet.add(current);
      current = parentMap.get(current);
    }
  }

  return Array.from(circularIds);
};
