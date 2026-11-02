const OUTPUT_SCALAR_KEYS = new Set([
  "asset_id",
  "image_id",
  "output_asset_id",
  "rendered_asset_id",
  "result_asset_id",
  "shot_reference_image_id"
]);
const REFERENCE_ARRAY_KEYS = new Set([
  "reference_image_ids",
  "reference_images"
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asUuids(value: unknown): string[] {
  if (typeof value === "string" && UUID_PATTERN.test(value)) return [value];
  if (Array.isArray(value))
    return value.filter(
      (v): v is string => typeof v === "string" && UUID_PATTERN.test(v)
    );
  return [];
}

export interface StepImageAssets {
  outputs: string[];
  references: string[];
}

export function extractStepImageAssets(
  result: Record<string, unknown> | null | undefined
): StepImageAssets {
  if (!result) return { outputs: [], references: [] };
  const outputs: string[] = [];
  const references: string[] = [];
  for (const [key, value] of Object.entries(result)) {
    if (OUTPUT_SCALAR_KEYS.has(key)) {
      outputs.push(...asUuids(value));
    } else if (REFERENCE_ARRAY_KEYS.has(key)) {
      references.push(...asUuids(value));
    }
  }
  return { outputs, references };
}
