import { LOCAL_MODEL_DEFINITIONS } from "../../shared/localModelDefinitions";
import { LOCAL_MODEL_BUNDLES } from "../../shared/localModelManifest";
import type { ModelFile } from "../localSetup/probeScriptSetup";

import { prepareModelRequirements } from "./prepareModelRequirements";

export const prepareSetupModelFiles = async (
  endpoint: string,
  files: ModelFile[],
  nodes: string[]
) => {
  const prepared = await prepareModelRequirements(endpoint, {
    nodes,
    files: files.map((file) => ({
      node: file.node,
      input: file.input,
      filename: file.name
    }))
  });
  return {
    nodes: prepared.nodes,
    files: files.map((file, index): ModelFile => {
      const selected = prepared.files[index];
      if (file.name === selected.filename && file.node === selected.node)
        return file;
      const manifest = LOCAL_MODEL_BUNDLES.flatMap(
        (bundle) => bundle.files
      ).find((entry) => entry.targetPath.endsWith(`/${selected.filename}`));
      const known = LOCAL_MODEL_DEFINITIONS.flatMap((model) =>
        model.variants.flatMap((variant) => variant.components)
      ).find((component) => component.filename === selected.filename);
      return {
        ...file,
        node: selected.node,
        name: selected.filename,
        alternatives: undefined,
        folder:
          selected.node === "UNETLoader"
            ? "diffusion_models"
            : selected.node === "UnetLoaderGGUF"
              ? "unet"
              : file.folder,
        url: manifest?.url ?? known?.downloadUrl ?? "",
        sha256: manifest?.sha256
      };
    })
  };
};
