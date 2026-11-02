export interface ControlNetOption {
  label: string;
  value: string;
}

const MERGED_CONTROL_NETS = [
  "normal_map_facemesh",
  "depth_facemesh",
  "depth_facemesh",
  "pose_facemesh",
  "softedge_facemesh",
  "pose_depth",
  "pose_depth_facemesh",
  "softedge_normal_map",
  "softedge_normal_map_facemesh"
];

const formatControlNetLabel = (
  name: string,
  controlNets: Array<{ name: string; video: string }>
): string => {
  const shouldWeDisplayOnlyMergedControlNet = controlNets.find((controlNet) =>
    MERGED_CONTROL_NETS.includes(controlNet.name)
  );
  if (shouldWeDisplayOnlyMergedControlNet) {
    return "All maps";
  }

  const nameWithoutUnderscore = name.replace("_", " ");

  return (
    nameWithoutUnderscore.charAt(0).toUpperCase() +
    nameWithoutUnderscore.slice(1)
  );
};

export const getControlNetOptions = (
  controlNets: Array<{ name: string; video: string }> | undefined
): ControlNetOption[] => {
  if (!controlNets || controlNets.length === 0) {
    return [{ label: "Video", value: "video" }];
  }

  const shouldWeDisplayOnlyMergedControlNet = controlNets.find((controlNet) =>
    MERGED_CONTROL_NETS.includes(controlNet.name)
  );

  if (shouldWeDisplayOnlyMergedControlNet) {
    return [
      { label: "Video", value: "video" },
      {
        label: formatControlNetLabel(
          shouldWeDisplayOnlyMergedControlNet.name,
          controlNets
        ),
        value: shouldWeDisplayOnlyMergedControlNet.name
      }
    ];
  } else {
    return [
      { label: "Video", value: "video" },
      ...controlNets.map((controlNet) => ({
        label: formatControlNetLabel(controlNet.name, controlNets),
        value: controlNet.name
      }))
    ];
  }
};
