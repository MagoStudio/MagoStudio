import { AssetStatus } from "@schemas/asset";
import { GlyphPalette } from "@styles/types";

export const getStatusColor = (status: AssetStatus): GlyphPalette => {
  switch (status) {
    case AssetStatus.ERROR:
      return "glyph-error";
    case AssetStatus.PENDING:
      return "glyph-primary";
    case AssetStatus.INQUEUE:
      return "glyph-primary";
    case AssetStatus.PAUSED:
      return "glyph-primary";
    case AssetStatus.INPROGRESS:
      return "glyph-warning";
    case AssetStatus.FINISHED:
      return "glyph-success";
    case AssetStatus.CANCELLED:
      return "glyph-action-main";
    default:
      return "glyph-primary";
  }
};
