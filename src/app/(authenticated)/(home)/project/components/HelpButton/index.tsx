"use client";

import { Icon } from "@components/Icon";
import { Menu } from "@components/Menu";
import { MenuItem } from "@components/MenuItem";
import { MenuItemButton } from "@components/MenuItemButton";
import { MenuList } from "@components/MenuList";
import { Text } from "@components/Text";
import { MEDIA_RESOURCES } from "@config/companyData";
import { isPlayingAtom } from "@store/atoms";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { TawkWidget } from "./TawkWidget";

export const HelpButton: React.FC = () => {
  const setIsPlaying = useSetAtom(isPlayingAtom);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const handleHelpButtonClick = () => {
    setIsPlaying(false);
    setIsSupportOpen(false);
    setIsShortcutsOpen(false);
  };

  const { t } = useTranslation();

  return (
    <div className="fixed z-help-button inset-0 pointer-events-none">
      <Menu
        placement="bottom-end"
        buttonClassName="absolute pt-3 overflow-hidden pointer-events-auto cursor-pointer right-4 bottom-4"
        button={
          <div
            className="flex justify-center items-center p-1.5 rounded-full hover:bg-element-secondary-active bg-glyph-primary-on-pic text-glyph-invert-main"
            data-onboarding-id="pf-chat-launcher"
            aria-label={t("titles.help_button.shortcut")}
            onClick={handleHelpButtonClick}
          >
            <Icon iconSet="24" iconName="help" />
          </div>
        }
        disableGutters
        className="z-10 pointer-events-auto"
      >
        <MenuList className="bg-element-tertiary w-56 !py-2">
          <MenuItem>
            <MenuItemButton
              onClick={() => setIsShortcutsOpen(!isShortcutsOpen)}
              data-onboarding-id="pf-shortcuts"
            >
              <Text variant="sm">{t("titles.help_button.shortcut")}</Text>
            </MenuItemButton>
          </MenuItem>
          <MenuItem>
            <MenuItemButton
              onClick={() => setIsSupportOpen(!isSupportOpen)}
              data-onboarding-id="pf-support"
            >
              <Text variant="sm">{t("titles.help_button.support")}</Text>
            </MenuItemButton>
          </MenuItem>
          <MenuItem>
            <MenuItemButton
              component="a"
              href={MEDIA_RESOURCES.DISCORD_COMMUNITY}
              target="_blank"
            >
              <Text variant="sm">{t("titles.help_button.discord")}</Text>
            </MenuItemButton>
          </MenuItem>
        </MenuList>
      </Menu>
      <TawkWidget
        showChat={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      <KeyboardShortcuts
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};
