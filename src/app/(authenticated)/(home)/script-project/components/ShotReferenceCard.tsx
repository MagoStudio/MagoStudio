import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { ImageThumbnail } from "@components/ImageThumbnail";
import { useCachedImageUrl } from "@domains/asset/useCachedImageUrl";
import { toDesktopCloudStorageUrl } from "@domains/asset/utils/toDesktopCloudStorageUrl";
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
  hasVoice: boolean;
  onRemove: () => void;
};

export const ShotReferenceCard: React.FC<Props> = ({
  chip,
  imageUrls,
  isBusy,
  hasVoice,
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
        src={
          isIntersecting && imageUrls?.url
            ? toDesktopCloudStorageUrl(imageUrls.url)
            : undefined
        }
        srcThumbnail={
          isIntersecting
            ? (cachedDisplayedImageUrl ??
              (displayedImageUrl &&
                toDesktopCloudStorageUrl(displayedImageUrl)))
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

      {hasVoice && (
        <div
          className="pointer-events-none absolute bottom-1 left-1 flex size-4 items-center justify-center rounded bg-element-on-image text-glyph-primary-on-pic"
          aria-label={t("script_project.voice.connected_voice.ariaLabel")}
          data-testid={`shot-reference-voice-${chip.token}`}
        >
          <Icon iconSet="16" iconName="volume-up" className="size-3" />
        </div>
      )}
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
    </div>
  );
};
