import path from "node:path";

import { resolveAppFolder } from "../resolveAppFolder";

export const resolveStarterEnginePaths = (localModelsRoot: string) => {
  const directory = resolveAppFolder(localModelsRoot);
  const cache = path.join(directory, ".downloads");
  const engine = path.join(directory, "ComfyUI_windows_portable");
  return {
    directory,
    cache,
    engine,
    engineMarker: path.join(cache, "engine-installed.json"),
    comfyDirectory: path.join(engine, "ComfyUI"),
    customNodesDirectory: path.join(engine, "ComfyUI", "custom_nodes"),
    embeddedPython: path.join(engine, "python_embeded", "python.exe")
  };
};
