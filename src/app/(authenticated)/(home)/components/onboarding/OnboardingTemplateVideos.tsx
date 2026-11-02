import { Icon } from "@components/Icon";
import { ONBOARDING_TEMPLATE_PREVIEWS } from "@domains/onboarding/constants";
import { Button } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

type Props = {
  onSelect: (shotName: string) => void;
  isDisabled: boolean;
};

const cardMaxHeightFillingWidth = "max-h-[calc((100cqw_-_48px)/4*330/248)]";

export const OnboardingTemplateVideos: React.FC<Props> = ({
  onSelect,
  isDisabled
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-0 w-full flex-1 items-center justify-center gap-4 [container-type:inline-size]">
      {ONBOARDING_TEMPLATE_PREVIEWS.map((preview, index) => (
        <Button
          key={preview.shotName}
          isDisabled={isDisabled}
          onPress={() => onSelect(preview.shotName)}
          aria-label={t("actions.use_template_video.label", {
            number: index + 1
          })}
          className={`group relative aspect-[248/330] h-full ${cardMaxHeightFillingWidth} overflow-hidden rounded-[20px] bg-element-primary outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60`}
        >
          <img
            src={preview.thumbnail}
            alt=""
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Icon
              iconSet="24-filled"
              iconName="play-forward"
              className="h-8 w-8 text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]"
            />
          </span>
        </Button>
      ))}
    </div>
  );
};
