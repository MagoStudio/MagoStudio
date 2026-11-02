import { Text } from "@components/Text";
import { useCopyToClipboard } from "@hooks/useCopyToClipboard";

interface DebugInfoRowProps {
  label: string;
  value: string;
}

export function DebugInfoRow({ label, value }: DebugInfoRowProps) {
  const { copyToClipboard } = useCopyToClipboard();

  return (
    <div className="flex justify-between gap-2">
      <Text variant="xs" color="glyph-tertiary" className="shrink-0">
        {label}
      </Text>
      <button
        onClick={() => copyToClipboard(value, false)}
        className="text-right truncate text-xs text-glyph-secondary hover:text-glyph-primary"
      >
        {value}
      </button>
    </div>
  );
}
