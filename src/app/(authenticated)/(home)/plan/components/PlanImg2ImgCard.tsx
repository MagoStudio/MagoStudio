import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { useClipReferenceImages } from "@domains/plan/useClipReferenceImages";
import { ShotImgPhase } from "@domains/plan/utils/buildShotRollups";
import { useTranslation } from "react-i18next";

import { PlanAssetPlaceholder } from "./PlanAssetPlaceholder";
import { PlanMetricChip } from "./PlanMetricChip";
import { PlanReferenceImage } from "./PlanReferenceImage";
import { PlanStepAssetImage } from "./PlanStepAssetImage";

interface PlanImg2ImgCardProps {
  img2img: ShotImgPhase;
  projectId: string | undefined;
}

export const PlanImg2ImgCard: React.FC<PlanImg2ImgCardProps> = ({
  img2img,
  projectId
}) => {
  const { t } = useTranslation();
  const hasResult = !!img2img.resultAssetId;

  const clipReferenceImages = useClipReferenceImages(
    img2img.resultAssetId,
    projectId
  );
  const inputImageId = img2img.inputImageIds[0];
  const referenceImageIds = [
    ...new Set([...clipReferenceImages, ...img2img.referenceImageIds])
  ];

  return (
    <div className="flex flex-col gap-3 p-3 rounded-lg bg-surface-bg-100">
      <div className="flex items-center justify-between gap-2">
        <Text variant="sm" weight="semibold" color="glyph-primary">
          {t("plan.phase.img2img.label")}
        </Text>
        {img2img.metric && <PlanMetricChip metric={img2img.metric} />}
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        {inputImageId && (
          <div className="flex flex-col gap-1">
            <Text variant="2xs" color="glyph-tertiary">
              {t("plan.phase.input_frame.label")}
            </Text>
            <PlanStepAssetImage assetId={inputImageId} className="h-40 w-40" />
          </div>
        )}

        <Icon
          iconSet="16"
          iconName="chevron-right"
          className="text-glyph-tertiary mb-8"
        />

        <div className="flex flex-col gap-1">
          <Text variant="2xs" color="glyph-tertiary">
            {t("plan.phase.result.label")}
          </Text>
          {hasResult ? (
            <PlanStepAssetImage
              assetId={img2img.resultAssetId!}
              className="h-40 w-40"
            />
          ) : (
            <PlanAssetPlaceholder />
          )}
        </div>
      </div>

      {referenceImageIds.length > 0 && (
        <div className="flex flex-col gap-1">
          <Text variant="2xs" color="glyph-tertiary">
            {t("plan.phase.references.label")}
          </Text>
          <div className="flex gap-2 flex-wrap">
            {referenceImageIds.map((id) => (
              <PlanReferenceImage key={id} assetId={id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
