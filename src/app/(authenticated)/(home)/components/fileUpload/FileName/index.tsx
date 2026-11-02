import { Text } from "@components/Text";
import { GlyphPalette } from "@styles/types";

import { truncateFileNameFixed } from "../helpers/truncateFileName";

type TextVariant = "3xl" | "2xs" | "xl" | "lg" | "base" | "md" | "sm" | "xs";

interface Props {
  fileName: string;
  keepStart?: number;
  keepEnd?: number;
  color?: GlyphPalette;
  variant?: TextVariant;
}

export function FileName({
  fileName,
  keepStart,
  keepEnd,
  color = "glyph-tertiary",
  variant
}: Props) {
  const displayName =
    keepStart !== undefined || keepEnd !== undefined
      ? truncateFileNameFixed(fileName, keepStart ?? 0, keepEnd ?? 0)
      : fileName;

  return (
    <div className="flex items-center gap-0.5 max-w-full">
      <Text
        align="center"
        color={color}
        variant={variant}
        select="none"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        className="max-w-full"
      >
        {displayName}
      </Text>
    </div>
  );
}
