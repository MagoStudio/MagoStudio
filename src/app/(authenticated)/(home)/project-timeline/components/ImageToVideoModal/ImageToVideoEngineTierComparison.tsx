import { Text } from "@components/Text";
import { SEEDANCE_2_I2V_FAST_CREDITS_PER_SECOND_BY_RESOLUTION } from "@models/video/seedance2I2vFastModel";
import {
  SEEDANCE_2_I2V_CREDITS_PER_SECOND_BY_RESOLUTION,
  SEEDANCE_2_I2V_RESOLUTION_OPTIONS
} from "@models/video/seedance2I2vModel";
import { useTranslation } from "react-i18next";

export const ImageToVideoEngineTierComparison: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div
      data-testid="image-to-video-engine-tier-comparison"
      className="flex flex-col gap-2"
    >
      <Text
        component="span"
        variant="sm"
        weight="bold"
        color="glyph-primary-on-pic"
      >
        {t("projectTimeline.imageToVideo.engineTier.comparison.title.label")}
      </Text>
      <table
        className="border-collapse"
        aria-label={t(
          "projectTimeline.imageToVideo.engineTier.comparison.ariaLabel"
        )}
      >
        <thead>
          <tr>
            <th className="pr-4 pb-1 text-left">
              <Text
                component="span"
                variant="xs"
                weight="semibold"
                color="glyph-primary-on-pic"
                whiteSpace="nowrap"
              >
                {t(
                  "projectTimeline.imageToVideo.engineTier.comparison.resolutionColumn.label"
                )}
              </Text>
            </th>
            <th className="pr-4 pb-1 text-right">
              <Text
                component="span"
                variant="xs"
                weight="semibold"
                color="glyph-primary-on-pic"
                whiteSpace="nowrap"
              >
                {t("projectTimeline.imageToVideo.engineTier.standard.label")}
              </Text>
            </th>
            <th className="pb-1 text-right">
              <Text
                component="span"
                variant="xs"
                weight="semibold"
                color="glyph-primary-on-pic"
                whiteSpace="nowrap"
              >
                {t("projectTimeline.imageToVideo.engineTier.fast.label")}
              </Text>
            </th>
          </tr>
        </thead>
        <tbody>
          {SEEDANCE_2_I2V_RESOLUTION_OPTIONS.map(({ value, label }) => {
            const isAvailableOnFastTier =
              value in SEEDANCE_2_I2V_FAST_CREDITS_PER_SECOND_BY_RESOLUTION;

            return (
              <tr key={value}>
                <td className="pr-4 text-left">
                  <Text
                    component="span"
                    variant="xs"
                    color="glyph-primary-on-pic"
                    whiteSpace="nowrap"
                  >
                    {label}
                  </Text>
                </td>
                <td className="pr-4 text-right">
                  <Text
                    component="span"
                    variant="xs"
                    color="glyph-primary-on-pic"
                    whiteSpace="nowrap"
                  >
                    {t(
                      "projectTimeline.imageToVideo.engineTier.comparison.creditsPerSecond.label",
                      {
                        credits:
                          SEEDANCE_2_I2V_CREDITS_PER_SECOND_BY_RESOLUTION[value]
                      }
                    )}
                  </Text>
                </td>
                <td className="text-right">
                  <Text
                    component="span"
                    variant="xs"
                    color="glyph-primary-on-pic"
                    whiteSpace="nowrap"
                  >
                    {isAvailableOnFastTier
                      ? t(
                          "projectTimeline.imageToVideo.engineTier.comparison.creditsPerSecond.label",
                          {
                            credits:
                              SEEDANCE_2_I2V_FAST_CREDITS_PER_SECOND_BY_RESOLUTION[
                                value
                              ]
                          }
                        )
                      : t(
                          "projectTimeline.imageToVideo.engineTier.comparison.unavailable.label"
                        )}
                  </Text>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
