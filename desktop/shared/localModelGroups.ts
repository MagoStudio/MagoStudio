import {
  LOCAL_MODEL_BUNDLES,
  type LocalModelBundle
} from "./localModelManifest";

export type LocalModelGroupInstallState =
  | "installed"
  | "partial"
  | "not-installed";

export interface LocalModelGroupNodePack {
  repositoryUrl: string;
  customNodesFolderName: string;
}

export type LocalModelGroupVariantId = string;

export interface LocalModelGroupHardwareVariant {
  id: LocalModelGroupVariantId;
  label: string;
  bundleIds: readonly string[];
  minimumVideoMemoryGigabytes: number;
}

interface LocalModelGroupDefinition {
  id: string;
  isAlwaysInstalled: boolean;
  nodePacks: readonly LocalModelGroupNodePack[];
  bundleIds: readonly string[];
  hardwareVariants?: readonly LocalModelGroupHardwareVariant[];
  defaultHardwareVariantId?: LocalModelGroupVariantId;
}

const GGUF_NODE_PACK: LocalModelGroupNodePack = {
  repositoryUrl: "https://github.com/city96/ComfyUI-GGUF",
  customNodesFolderName: "ComfyUI-GGUF"
};

const LOCAL_MODEL_GROUP_DEFINITIONS = [
  {
    id: "minimal",
    isAlwaysInstalled: true,
    nodePacks: [
      {
        repositoryUrl: "https://github.com/kijai/ComfyUI-KJNodes",
        customNodesFolderName: "comfyui-kjnodes"
      },
      {
        repositoryUrl:
          "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite",
        customNodesFolderName: "comfyui-videohelpersuite"
      },
      {
        repositoryUrl:
          "https://github.com/Jalen-Brunson/ComfyUI-MiniMax-H3-PDD-Acc",
        customNodesFolderName: "ComfyUI-MiniMax-H3-PDD-Acc"
      }
    ],
    bundleIds: [
      "qwen-vl",
      "minimax-h3",
      "minimax-h3-high-quality",
      "minimax-h3-vfx-loras"
    ]
  },
  {
    id: "local-llm",
    isAlwaysInstalled: false,
    nodePacks: [
      {
        repositoryUrl: "https://github.com/KLL535/ComfyUI_Simple_Qwen3-VL-gguf",
        customNodesFolderName: "ComfyUI_Simple_Qwen3-VL-gguf"
      }
    ],
    bundleIds: [],
    hardwareVariants: [
      {
        id: "qwen38-27b-q3",
        label: "Q3",
        bundleIds: ["local-llm-q3"],
        minimumVideoMemoryGigabytes: 0
      },
      {
        id: "qwen38-27b-q5",
        label: "Q5",
        bundleIds: ["local-llm-q5"],
        minimumVideoMemoryGigabytes: 24
      }
    ],
    defaultHardwareVariantId: "qwen38-27b-q5"
  },
  {
    id: "qwen-image",
    isAlwaysInstalled: false,
    nodePacks: [GGUF_NODE_PACK],
    bundleIds: ["qwen-image"]
  },
  {
    id: "flux-image",
    isAlwaysInstalled: false,
    nodePacks: [GGUF_NODE_PACK],
    bundleIds: ["flux2-klein-4b"]
  }
] as const satisfies readonly LocalModelGroupDefinition[];

export type LocalModelGroupId =
  (typeof LOCAL_MODEL_GROUP_DEFINITIONS)[number]["id"];

export type LocalModelGroup = LocalModelGroupDefinition & {
  id: LocalModelGroupId;
};

export type SelectedModelGroupVariants = Partial<
  Record<LocalModelGroupId, LocalModelGroupVariantId>
>;

export const LOCAL_MODEL_GROUPS: readonly LocalModelGroup[] =
  LOCAL_MODEL_GROUP_DEFINITIONS;

export const LOCAL_MODEL_GROUP_IDS: readonly LocalModelGroupId[] =
  LOCAL_MODEL_GROUPS.map((group) => group.id);

export const SCRIPT_TEXT_MODEL_GROUP_ID: LocalModelGroupId = "local-llm";

export const ALWAYS_INSTALLED_MODEL_GROUP_IDS: readonly LocalModelGroupId[] =
  LOCAL_MODEL_GROUPS.filter((group) => group.isAlwaysInstalled).map(
    (group) => group.id
  );

export const isModelGroupAlwaysInstalled = (groupId: LocalModelGroupId) =>
  ALWAYS_INSTALLED_MODEL_GROUP_IDS.includes(groupId);

export const findLocalModelGroup = (
  groupId: LocalModelGroupId
): LocalModelGroup => {
  const group = LOCAL_MODEL_GROUPS.find(
    (candidate) => candidate.id === groupId
  );
  if (!group) throw new Error(`Unknown model group: ${groupId}`);
  return group;
};

export const isLocalModelGroupId = (
  value: unknown
): value is LocalModelGroupId =>
  typeof value === "string" &&
  (LOCAL_MODEL_GROUP_IDS as readonly string[]).includes(value);

export const allBundleIdsOfModelGroup = (
  group: LocalModelGroup
): readonly string[] => [
  ...group.bundleIds,
  ...(group.hardwareVariants ?? []).flatMap((variant) => variant.bundleIds)
];

export const resolveSelectedHardwareVariant = (
  group: LocalModelGroup,
  selectedModelGroupVariants: SelectedModelGroupVariants
): LocalModelGroupHardwareVariant | null => {
  if (!group.hardwareVariants) return null;
  const savedVariantId = selectedModelGroupVariants[group.id];
  const selectedVariant =
    group.hardwareVariants.find((variant) => variant.id === savedVariantId) ??
    group.hardwareVariants.find(
      (variant) => variant.id === group.defaultHardwareVariantId
    );
  if (!selectedVariant)
    throw new Error(`Model group ${group.id} has no default hardware variant`);
  return selectedVariant;
};

export const hardwareVariantLabel = (
  groupId: LocalModelGroupId,
  variantId: LocalModelGroupVariantId
): string => {
  const variant = findLocalModelGroup(groupId).hardwareVariants?.find(
    (candidate) => candidate.id === variantId
  );
  if (!variant)
    throw new Error(`Model group ${groupId} has no variant ${variantId}`);
  return variant.label;
};

export const resolveModelGroupBundles = (
  groupId: LocalModelGroupId,
  selectedModelGroupVariants: SelectedModelGroupVariants
): LocalModelBundle[] => {
  const group = findLocalModelGroup(groupId);
  const bundleIds = [
    ...group.bundleIds,
    ...(resolveSelectedHardwareVariant(group, selectedModelGroupVariants)
      ?.bundleIds ?? [])
  ];
  return LOCAL_MODEL_BUNDLES.filter((bundle) => bundleIds.includes(bundle.id));
};

const BYTES_PER_GIGABYTE = 1_073_741_824;

export const pickHardwareVariantForVideoMemory = (
  hardwareVariants: readonly LocalModelGroupHardwareVariant[],
  videoMemoryBytes: number | null
): LocalModelGroupVariantId => {
  const videoMemoryGigabytes =
    videoMemoryBytes === null
      ? 0
      : Math.round(videoMemoryBytes / BYTES_PER_GIGABYTE);
  const fittingVariants = hardwareVariants.filter(
    (variant) => variant.minimumVideoMemoryGigabytes <= videoMemoryGigabytes
  );
  const largestFittingVariant = fittingVariants.reduce<
    LocalModelGroupHardwareVariant | undefined
  >(
    (largest, variant) =>
      !largest ||
      variant.minimumVideoMemoryGigabytes > largest.minimumVideoMemoryGigabytes
        ? variant
        : largest,
    undefined
  );
  if (!largestFittingVariant)
    throw new Error("No hardware variant fits this machine");
  return largestFittingVariant.id;
};
