import type {
  ModelComponentDefinition,
  ModelRuntime
} from "../../shared/modelSettings";

export const selectComfyLoaderForModelFile = ({
  component,
  filename,
  runtime
}: {
  component: Pick<ModelComponentDefinition, "role" | "loader">;
  filename: string;
  runtime: ModelRuntime;
}): string => {
  const isComfyMainModel = component.role === "main" && runtime === "comfy";
  if (!isComfyMainModel) return component.loader;
  return filename.toLowerCase().endsWith(".gguf")
    ? "UnetLoaderGGUF"
    : "UNETLoader";
};
