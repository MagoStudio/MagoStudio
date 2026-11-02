/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { CircularProgress } from "@components/CircularProgress";
import { CloseButton } from "@components/CloseButton";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { activeHotkeyAtom } from "@store/atoms";
import { cn } from "@utils";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useState } from "react";
import { FocusScope } from "react-aria";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";

import { ImagePreviewOverlayView } from "./ImagePreviewOverlayView";
import { ImagePreviewSideBySideView } from "./ImagePreviewSideBySideView";
import { ImagePreviewSingleView } from "./ImagePreviewSingleView";

type ViewMode = "single" | "overlay" | "sbs";

export type ImagePreviewProps = {
  imgSrc?: string;
  name?: string;
  onClose: () => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  sourceImageSrc?: string;
  maskOverlaySrc?: string;
  overlay?: React.ReactNode;
  footer?: React.ReactNode;
  isLoading?: boolean;
};

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imgSrc,
  name,
  onClose,
  onNavigatePrev,
  onNavigateNext,
  canNavigatePrev = false,
  canNavigateNext = false,
  isFavorite = false,
  onToggleFavorite,
  sourceImageSrc,
  maskOverlaySrc,
  overlay,
  footer,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const activeScope = useAtomValue(activeHotkeyAtom);
  const setActiveScope = useSetAtom(activeHotkeyAtom);

  useEffect(() => {
    setActiveScope("Img2ImgZoomView");
    return () => setActiveScope("Img2ImgView");
  }, [setActiveScope]);

  const isLeftEnabled =
    canNavigatePrev && !!onNavigatePrev && activeScope === "Img2ImgZoomView";
  const isRightEnabled =
    canNavigateNext && !!onNavigateNext && activeScope === "Img2ImgZoomView";

  useHotkeys(
    "left",
    () => {
      onNavigatePrev?.();
    },
    {
      preventDefault: true,
      enabled: isLeftEnabled,
      enableOnFormTags: true
    },
    [isLeftEnabled, onNavigatePrev]
  );

  useHotkeys(
    "right",
    () => {
      onNavigateNext?.();
    },
    {
      preventDefault: true,
      enabled: isRightEnabled,
      enableOnFormTags: true
    },
    [isRightEnabled, onNavigateNext]
  );

  useHotkeys(
    "escape",
    () => {
      onClose();
    },
    {
      preventDefault: true,
      enabled: activeScope === "Img2ImgZoomView"
    },
    [onClose, activeScope]
  );

  const [viewMode, setViewMode] = useState<ViewMode>(
    sourceImageSrc ? "sbs" : "single"
  );

  const showViewModeButtons = !!sourceImageSrc;

  const renderViewContent = () => {
    if (!imgSrc) {
      return null;
    }

    if (isLoading) {
      return null;
    }

    if (viewMode === "overlay" && sourceImageSrc) {
      return (
        <ImagePreviewOverlayView
          imgSrc={imgSrc}
          sourceImageSrc={sourceImageSrc}
          maskOverlaySrc={maskOverlaySrc}
          name={name}
        />
      );
    }

    if (viewMode === "sbs" && sourceImageSrc) {
      return (
        <ImagePreviewSideBySideView
          imgSrc={imgSrc}
          sourceImageSrc={sourceImageSrc}
          maskOverlaySrc={maskOverlaySrc}
          name={name}
        />
      );
    }

    return (
      <ImagePreviewSingleView imgSrc={imgSrc} name={name} overlay={overlay} />
    );
  };

  return (
    <FocusScope contain restoreFocus>
      <div className="fixed inset-0 flex flex-col bg-black" tabIndex={-1}>
        <div className="flex items-center justify-between px-2 py-2 bg-surface-secondary">
          <div className="flex items-center gap-1">
            {showViewModeButtons && (
              <>
                <IconActionButton
                  aria-label={t("actions.single_view.label")}
                  aria-pressed={viewMode === "single"}
                  icon={<Icon iconSet="24-filled" iconName="one-sbs" />}
                  size="sm"
                  className={
                    viewMode === "single" ? "text-glyph-primary" : undefined
                  }
                  onPress={() => setViewMode("single")}
                />
                <IconActionButton
                  aria-label={t("actions.overlay_view.label")}
                  aria-pressed={viewMode === "overlay"}
                  icon={<Icon iconSet="24-filled" iconName="one-on-another" />}
                  size="sm"
                  className={
                    viewMode === "overlay" ? "text-glyph-primary" : undefined
                  }
                  onPress={() => setViewMode("overlay")}
                />
                <IconActionButton
                  aria-label={t("actions.side_by_side_view.label")}
                  aria-pressed={viewMode === "sbs"}
                  icon={<Icon iconSet="24-filled" iconName="two-sbs" />}
                  size="sm"
                  className={
                    viewMode === "sbs" ? "text-glyph-primary" : undefined
                  }
                  onPress={() => setViewMode("sbs")}
                />
              </>
            )}
          </div>
          <CloseButton
            onPress={onClose}
            className="focus:outline-none focus-visible:outline-none"
          />
        </div>
        {onToggleFavorite && (
          <IconActionButton
            aria-label={t("actions.set_as_favorite.label")}
            aria-pressed={isFavorite}
            icon={
              <Icon
                iconSet="16-filled"
                iconName="rating"
                className={cn(
                  isFavorite
                    ? "text-element-in-progress"
                    : "text-glyph-tertiary"
                )}
              />
            }
            onPress={onToggleFavorite}
            className="absolute top-14 right-3"
          />
        )}
        <div
          className="flex flex-1 items-center justify-center cursor-zoom-out overflow-hidden"
          onClick={onClose}
        >
          {isLoading ? <CircularProgress size="md" /> : renderViewContent()}
        </div>
        {footer && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {footer}
          </div>
        )}
      </div>
    </FocusScope>
  );
};
