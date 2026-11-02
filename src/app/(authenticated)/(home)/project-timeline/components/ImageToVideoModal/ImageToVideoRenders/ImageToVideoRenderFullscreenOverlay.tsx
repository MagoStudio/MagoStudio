import { Backdrop } from "@components/Backdrop";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Text } from "@components/Text";
import { Dialog, DialogPanel } from "@headlessui/react";
import { useTranslation } from "react-i18next";

interface ImageToVideoRenderFullscreenOverlayProps {
  videoUrl: string;
  trackName: string;
  onClose: () => void;
}

export const ImageToVideoRenderFullscreenOverlay: React.FC<
  ImageToVideoRenderFullscreenOverlayProps
> = ({ videoUrl, trackName, onClose }) => {
  const { t } = useTranslation();

  return (
    <Dialog
      as="div"
      className="fixed inset-0 z-modal overflow-hidden"
      open
      onClose={onClose}
    >
      <Backdrop className="bg-surface-modal-backdrop" />
      <div className="fixed inset-4">
        <DialogPanel className="relative z-10 flex h-full w-full flex-col overflow-hidden rounded-3xl bg-black">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-glyph-invert-main bg-surface-secondary px-4">
            <Text
              component="span"
              variant="sm"
              weight="semibold"
              color="glyph-primary-on-pic"
              className="truncate select-none"
            >
              {trackName}
            </Text>
            <IconActionButton
              aria-label={t("actions.close_fullscreen.label")}
              icon={<Icon iconSet="16" iconName="fullscreen-off" />}
              onPress={onClose}
              size="sm"
              variant="dark"
            />
          </div>
          <div className="relative flex flex-1 min-h-0 w-full items-center justify-center overflow-hidden bg-black">
            <video
              src={videoUrl}
              controls
              autoPlay
              className="h-full w-full object-contain"
            />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
