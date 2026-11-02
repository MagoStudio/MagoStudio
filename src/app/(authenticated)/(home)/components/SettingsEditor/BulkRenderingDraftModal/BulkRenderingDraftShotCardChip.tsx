import { Text } from "@components/Text";

export function BulkRenderingDraftShotCardChip({ label }: { label: string }) {
  return (
    <div className="flex items-center rounded bg-element-on-image px-1.5 py-0.5 backdrop-blur-[10px]">
      <Text component="span" variant="sm" color="glyph-primary-on-pic">
        {label}
      </Text>
    </div>
  );
}
