import type { SelectHTMLAttributes } from "react";

export const ModelSettingsSelect = (
  props: SelectHTMLAttributes<HTMLSelectElement>
) => (
  <select
    {...props}
    className="h-8 min-w-0 rounded border border-element-primary bg-element-primary px-2 text-sm text-glyph-secondary outline-hidden focus-visible:outline-1 focus-visible:outline-glyph-action-main"
  />
);
