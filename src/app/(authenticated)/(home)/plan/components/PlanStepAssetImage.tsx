import { ImageThumbnail } from "@components/ImageThumbnail";
import { useImageAsset } from "@domains/asset/useImageAsset";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

interface PlanStepAssetImageProps {
  assetId: string;
  className?: string;
}

export const PlanStepAssetImage: React.FC<PlanStepAssetImageProps> = ({
  assetId,
  className
}) => {
  const { t } = useTranslation();
  const { data, isLoading } = useImageAsset({ assetId, enabled: true });
  const url = data?.urlToUse;

  return (
    <ImageThumbnail
      src={url}
      alt={t("plan.step_result_image_alt.label")}
      isLoading={isLoading}
      classNames={{
        root: cn("aspect-square h-40 w-40 flex-none", className)
      }}
    />
  );
};
