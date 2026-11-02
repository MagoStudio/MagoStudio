import path from "node:path";

export const resolveNodePackBackupsFolder = (customNodesFolder: string) =>
  path.join(path.dirname(customNodesFolder), "backups");
