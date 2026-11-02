export type ComfyGraphNode = {
  class_type: string;
  inputs: Record<string, unknown>;
};

export type ComfyGraph = Record<string, ComfyGraphNode>;
