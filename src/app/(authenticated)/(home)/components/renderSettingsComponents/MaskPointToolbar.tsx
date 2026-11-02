"use client";

import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { maskPreviewToolAtom } from "@store/maskPreviewStore";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

interface MaskPointToolbarProps {
  onClearPoints: () => void;
}

export const MaskPointToolbar: React.FC<MaskPointToolbarProps> = ({
  onClearPoints
}) => {
  const { t } = useTranslation();
  const [activeTool, setActiveTool] = useAtom(maskPreviewToolAtom);

  return (
    <div className="flex items-center gap-1 w-full">
      <GhostButton
        className={`flex-1 max-w-[250px] ${
          activeTool === "add"
            ? "bg-element-primary-on-pic! text-glyph-invert-main!"
            : ""
        }`}
        onPress={() => setActiveTool("add")}
        startIcon={
          <Icon iconSet="16" iconName="plus" className="text-current" />
        }
      >
        {t("masking.visual_selection.add_point.label")}
      </GhostButton>
      <GhostButton
        className={`flex-1 max-w-[250px] ${
          activeTool === "remove"
            ? "bg-element-primary-on-pic! text-glyph-invert-main!"
            : ""
        }`}
        onPress={() => setActiveTool("remove")}
        startIcon={
          <Icon iconSet="16" iconName="minus" className="text-current" />
        }
      >
        {t("masking.visual_selection.remove_point.label")}
      </GhostButton>
      <GhostButton className="flex-1 max-w-[250px]" onPress={onClearPoints}>
        {t("masking.visual_selection.clear_all.label")}
      </GhostButton>
    </div>
  );
};
