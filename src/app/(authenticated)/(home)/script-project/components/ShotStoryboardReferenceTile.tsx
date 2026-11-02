import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { ImageThumbnail } from "@components/ImageThumbnail";
import { Text } from "@components/Text";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

type Props = {
  storyboardImageUrl: string;
  isBusy: boolean;
  onRemove: () => void;
  testId: string;
};

export const ShotStoryboardReferenceTile: React.FC<Props> = ({
  storyboardImageUrl,
  isBusy,
  onRemove,
  testId
}) => {
  const { t } = useTranslation();
  const storyboardLabel = t("script_project.storyboard_version_badge.label");

  return (
    <div
      data-testid={testId}
      className="group relative h-[50px] w-full overflow-hidden rounded bg-element-primary"
    >
      <ImageThumbnail
        src={storyboardImageUrl}
        srcThumbnail={storyboardImageUrl}
        name={storyboardLabel}
        alt={storyboardLabel}
        classNames={{
          root: "h-full w-full rounded border-transparent hover:border-transparent",
          controlsContainer: "hidden"
        }}
      >
        {(openZoom) => (
          <AriaButton
            aria-label={t("script_project.zoom_reference_button.ariaLabel", {
              name: storyboardLabel
            })}
            onPress={openZoom}
            className="absolute inset-0 cursor-zoom-in outline-hidden"
          />
        )}
      </ImageThumbnail>
      <div className="absolute right-1 top-1 flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <IconActionButton
          aria-label={t("script_project.remove_storyboard_button.ariaLabel")}
          icon={<Icon iconSet="16" iconName="delete" />}
          variant="onImage"
          size="xs"
          isDisabled={isBusy}
          onPress={onRemove}
          data-testid={`${testId}-remove`}
        />
      </div>
      <Text
        variant="2xs"
        color="glyph-primary-on-pic"
        className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-surface-on-image-opacity-80 px-1"
      >
        {storyboardLabel}
      </Text>
    </div>
  );
};
