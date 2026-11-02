import { Text } from "@components/Text";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useTool } from "@hooks/tool/useTool";
import { trackingWithProjectId } from "@hooks/tracking/trackingUtils";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

import { AiRenderIcon } from "./AiRenderIcon";

type Props = {
  isDisabled?: boolean;
  label?: string;
};

export const StylizeFrameButton: React.FC<Props> = ({ isDisabled, label }) => {
  const { t } = useTranslation();
  const selectedProjectId = useSelectedProjectId();
  const { setTool } = useTool();

  const handleOpenGenerateImageModal = () => {
    trackingWithProjectId.renderActions.img2imgCreateImageClick(
      selectedProjectId
    );
    setTool("edit-frame");
  };

  return (
    <button
      data-onboarding-id="pf-create-image"
      className={cn(
        "flex flex-col items-center justify-center h-full w-full rounded-lg p-px",
        "bg-gradient-100",
        isDisabled && "pointer-events-none"
      )}
      disabled={isDisabled}
      onClick={handleOpenGenerateImageModal}
      type="button"
    >
      <div className="flex flex-col items-center justify-center gap-1 w-full h-full rounded-[7px] bg-[#191919] hover:bg-element-primary-active p-1.5">
        <div className="h-4 w-4">
          <AiRenderIcon disabled={isDisabled} />
        </div>
        <Text color="glyph-primary" disabled={isDisabled} select="none">
          {label || t("actions.stylize_frame.label")}
        </Text>
      </div>
    </button>
  );
};
