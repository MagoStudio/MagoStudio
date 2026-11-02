import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { ImageThumbnail } from "@components/ImageThumbnail";
import { Text } from "@components/Text";
import { useCachedImageUrl } from "@domains/asset/useCachedImageUrl";
import { SheetImageUrls } from "@domains/scriptProject/utils/buildSheetImageUrlIndex";
import { ShotReferenceChip } from "@domains/scriptProject/utils/buildShotReferenceChips";
import { cn } from "@utils";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";
import { useIntersectionObserver } from "usehooks-ts";

type Props = {
  chip: ShotReferenceChip;
  imageUrls: SheetImageUrls | undefined;
  isBusy: boolean;
  onRemove: () => void;
};

export const ShotReferenceCard: React.FC<Props> = ({
  chip,
  imageUrls,
  isBusy,
  onRemove
}) => {
  const { t } = useTranslation();
  const { ref: visibilityRef, isIntersecting } = useIntersectionObserver({
    rootMargin: "160px"
  });

  const displayedImageUrl = imageUrls?.thumbnailUrl ?? imageUrls?.url;
  const cachedDisplayedImageUrl = useCachedImageUrl(
    chip.assetId ? displayedImageUrl : undefined,
    imageUrls?.thumbnailUrl ? `${chip.assetId}_thumb` : `${chip.assetId}`,
    isIntersecting
  );

  const referenceName = chip.versionName ?? chip.name;

  return (
    <div
      ref={visibilityRef}
      data-testid={`shot-reference-chip-${chip.token}`}
      className={cn(
        "group relative h-[50px] w-full overflow-hidden rounded",
        chip.missingReason ? "border border-glyph-error" : "bg-element-primary"
      )}
    >
      <ImageThumbnail
        assetId={chip.assetId ?? undefined}
        src={isIntersecting ? imageUrls?.url : undefined}
        srcThumbnail={
          isIntersecting
            ? (cachedDisplayedImageUrl ?? displayedImageUrl)
            : undefined
        }
        name={referenceName}
        alt={chip.name}
        classNames={{
          root: "h-full w-full rounded border-transparent hover:border-transparent",
          controlsContainer: "hidden"
        }}
      >
        {(openZoom) => (
          <AriaButton
            aria-label={t("script_project.zoom_reference_button.ariaLabel", {
              name: chip.name
            })}
            onPress={openZoom}
            className="absolute inset-0 cursor-zoom-in outline-hidden"
            data-testid={`shot-zoom-reference-${chip.token}`}
          />
        )}
      </ImageThumbnail>

      <div className="absolute right-1 top-1 flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <IconActionButton
          aria-label={t("script_project.remove_reference_button.ariaLabel", {
            name: chip.name
          })}
          icon={<Icon iconSet="16" iconName="delete" />}
          variant="onImage"
          size="xs"
          isDisabled={isBusy}
          onPress={onRemove}
          data-testid={`shot-remove-reference-${chip.token}`}
        />
      </div>

      <Text
        variant="2xs"
        color="glyph-primary-on-pic"
        className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-surface-on-image-opacity-80 px-1"
      >
        {referenceName}
      </Text>
    </div>
  );
};
