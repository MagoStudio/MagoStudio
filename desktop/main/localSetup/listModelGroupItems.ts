import path from "node:path";

import {
  findLocalModelGroup,
  resolveModelGroupBundles,
  type LocalModelGroupId,
  type SelectedModelGroupVariants
} from "../../shared/localModelGroups";
import { LOCAL_NODE_PACK_PINS } from "../../shared/localNodePackPins";

import { resolveStarterEnginePaths } from "./resolveStarterEnginePaths";

export type ModelGroupItem =
  | {
      kind: "node-pack";
      name: string;
      sha256: string;
      downloadUrl: string;
      archiveStripRoot: boolean;
      absolutePath: string;
    }
  | {
      kind: "model-file";
      name: string;
      sha256: string;
      bytes: number;
      downloadUrl: string;
      absolutePath: string;
    };

export const listModelGroupItems = ({
  groupId,
  selectedModelGroupVariants,
  localModelsRoot
}: {
  groupId: LocalModelGroupId;
  selectedModelGroupVariants: SelectedModelGroupVariants;
  localModelsRoot: string;
}): ModelGroupItem[] => {
  const { comfyDirectory, customNodesDirectory } =
    resolveStarterEnginePaths(localModelsRoot);
  const nodePackItems = findLocalModelGroup(groupId).nodePacks.map(
    (nodePack): ModelGroupItem => {
      const pin = LOCAL_NODE_PACK_PINS[nodePack.repositoryUrl];
      if (!pin)
        throw new Error(`No pinned version for ${nodePack.repositoryUrl}`);
      return {
        kind: "node-pack",
        name: nodePack.customNodesFolderName,
        sha256: pin.sha256,
        downloadUrl: pin.url,
        archiveStripRoot: pin.stripRoot,
        absolutePath: path.join(
          customNodesDirectory,
          nodePack.customNodesFolderName
        )
      };
    }
  );
  const modelFileItems = resolveModelGroupBundles(
    groupId,
    selectedModelGroupVariants
  ).flatMap((bundle) =>
    bundle.files.map((file): ModelGroupItem => {
      if (!file.sha256)
        throw new Error(`No SHA-256 pinned for ${file.targetPath}`);
      return {
        kind: "model-file",
        name: path.basename(file.targetPath),
        sha256: file.sha256,
        bytes: file.bytes,
        downloadUrl: file.url,
        absolutePath: path.join(comfyDirectory, file.targetPath)
      };
    })
  );
  return [...nodePackItems, ...modelFileItems];
};
