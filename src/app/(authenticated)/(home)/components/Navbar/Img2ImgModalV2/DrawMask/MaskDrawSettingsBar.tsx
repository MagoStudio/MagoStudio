import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { cn } from "@utils";
import React from "react";
import { useTranslation } from "react-i18next";

import { BrushSizeSlider } from "./BrushSizeSlider";
import type { MaskTool } from "./types";

type Props = {
  tool: MaskTool;
  onToolChange: (tool: MaskTool) => void;
  onClearAll: () => void;
  brushStep: number;
  onBrushStepChange: (step: number) => void;
  brushPx: number;
  isBrushPreviewVisible: boolean;
};

const toolButtonClass = "border-0 bg-element-primary";
const activeToolClass =
  "!border-0 !bg-element-primary-on-pic !text-glyph-invert-main";

export const MaskDrawSettingsBar: React.FC<Props> = ({
  tool,
  onToolChange,
  onClearAll,
  brushStep,
  onBrushStepChange,
  brushPx,
  isBrushPreviewVisible
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full items-center gap-2 bg-surface-secondary py-2 pr-4">
      <GhostButton
        startIcon={<Icon iconSet="16" iconName="draw" />}
        onPress={() => onToolChange("draw")}
        className={cn(toolButtonClass, tool === "draw" && activeToolClass)}
      >
        {t("img2imgForms.draw_mask.draw")}
      </GhostButton>
      <GhostButton
        startIcon={<Icon iconSet="16" iconName="erase" />}
        onPress={() => onToolChange("erase")}
        className={cn(toolButtonClass, tool === "erase" && activeToolClass)}
      >
        {t("img2imgForms.draw_mask.erase")}
      </GhostButton>
      <GhostButton
        startIcon={<Icon iconSet="16" iconName="clean-all" />}
        onPress={onClearAll}
        className={cn(toolButtonClass, "gap-1 px-1.5")}
      >
        {t("img2imgForms.draw_mask.clear_all")}
      </GhostButton>
      <BrushSizeSlider
        value={brushStep}
        onChange={onBrushStepChange}
        label={t("img2imgForms.draw_mask.brush_size")}
        tool={tool}
        brushPx={brushPx}
        isPreviewVisible={isBrushPreviewVisible}
      />
    </div>
  );
};
