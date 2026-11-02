import { ImageThumbnail } from "@components/ImageThumbnail";
import { useImageAsset } from "@domains/asset/useImageAsset";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

interface PlanReferenceImageProps {
  assetId: string;
  className?: string;
}

export const PlanReferenceImage: React.FC<PlanReferenceImageProps> = ({
  assetId,
  className
}) => {
  const { t } = useTranslation();
  const { data, isLoading } = useImageAsset({ assetId, enabled: true });

  const frameUrls =
    data?.labeled_frames?.map((f) => f.url) ??
    data?.frames?.map((f) => f.url) ??
    (data?.urlToUse ? [data.urlToUse] : []);

  if (isLoading || frameUrls.length === 0) {
    return (
      <ImageThumbnail
        src={undefined}
        alt={t("plan.step_result_image_alt.label")}
        isLoading={isLoading}
        classNames={{
          root: cn("aspect-square h-20 w-20 flex-none", className)
        }}
      />
    );
  }

  return (
    <>
      {frameUrls.map((url, i) => (
        <ImageThumbnail
          key={`${assetId}-${i}`}
          src={url}
          alt={t("plan.step_result_image_alt.label")}
          isLoading={false}
          classNames={{
            root: cn("aspect-square h-20 w-20 flex-none", className)
          }}
        />
      ))}
    </>
  );
};
