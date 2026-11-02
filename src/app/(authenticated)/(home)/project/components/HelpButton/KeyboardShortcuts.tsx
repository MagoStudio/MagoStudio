"use client";

import { CloseButton } from "@components/CloseButton";
import { Text } from "@components/Text";
import { useIsMacOS } from "@hooks/useIsMacOS";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcuts: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const isMac = useIsMacOS();

  if (!isOpen) return null;

  const modifierKey = isMac
    ? t("titles.modifier_key_mac")
    : t("titles.modifier_key_win");

  const shortcuts = [
    {
      action: t("titles.toggle_settings_action"),
      key: t("titles.toggle_settings_key")
    },
    {
      action: t("titles.play_action"),
      key: t("titles.play_key")
    },
    {
      action: t("titles.beginning_action"),
      key: t("titles.beginning_key")
    },
    {
      action: t("titles.tracks_action"),
      key: t("titles.tracks_key")
    },
    {
      action: t("titles.frames_action"),
      key: t("titles.frames_key")
    },
    {
      action: t("titles.compare_action"),
      key: t("titles.compare_key", { modifierKey })
    }
  ];

  return (
    <div
      className={cn(
        "absolute z-10",
        "bg-element-tertiary",
        "rounded-md",
        "shadow-lg",
        "w-[600px]",
        "max-h-[400px]",
        "overflow-auto",
        "bottom-48 right-4",
        "text-glyph-secondary",
        "pb-3",
        "pointer-events-auto"
      )}
    >
      <div className="flex items-center justify-between mb-4 px-3 pt-3">
        <Text variant="md" weight="semibold" color="glyph-secondary">
          {t("titles.keyboard_shortcuts_title")}
        </Text>
        <CloseButton onClick={onClose} />
      </div>

      <div className="w-full">
        <div className="border-t border-surface-primary w-full" />

        {shortcuts.map((shortcut, index) => (
          <div key={index}>
            <div className="flex items-center px-3 py-2">
              <div className="flex-1">
                <Text variant="sm" color="glyph-secondary">
                  {shortcut.action}
                </Text>
              </div>
              <div className="flex-1">
                <Text variant="sm" color="glyph-secondary">
                  {shortcut.key}
                </Text>
              </div>
            </div>
            {index < shortcuts.length - 1 && (
              <div className="border-t border-glyph-stroke mx-3" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
