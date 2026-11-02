"use client";

import { Icon } from "@components/Icon";
import { Menu } from "@components/Menu";
import { MenuItem } from "@components/MenuItem";
import { MenuItemButton } from "@components/MenuItemButton";
import { MenuItemText } from "@components/MenuItemText";
import { MenuList } from "@components/MenuList";
import { Text } from "@components/Text";
import { useAddVideo } from "@hooks/useAddVideo";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

import { useOpenImageToVideoModal } from "./ImageToVideoModal/hooks/useOpenImageToVideoModal";

interface TimelineAddCellProps {
  widthPx: number;
}

export function TimelineAddCell({ widthPx }: TimelineAddCellProps) {
  const { t } = useTranslation();
  const { triggerAddVideo } = useAddVideo();
  const { openImageToVideoModal } = useOpenImageToVideoModal();

  return (
    <Menu
      className="shrink-0 my-1 ml-1 mr-2"
      button={
        <AriaButton
          type="button"
          aria-label={t("actions.add_video.label")}
          data-testid="project-timeline-add-cell"
          style={{ width: `calc(${widthPx}px - 12px)` }}
          className="group h-[68px] flex items-center justify-center rounded border-2 border-dashed border-glyph-stroke-2 bg-element-primary outline-hidden transition-colors data-[hovered]:border-glyph-secondary"
        >
          <span className="flex items-center gap-1.5 h-6 px-2 text-glyph-tertiary transition-colors group-data-[hovered]:text-glyph-primary">
            <Icon iconSet="16" iconName="plus" />
            <Text component="span" variant="sm" color="inherit">
              {t("actions.add.label")}
            </Text>
          </span>
        </AriaButton>
      }
      placement="bottom-start"
    >
      {({ close }) => (
        <MenuList>
          <MenuItem>
            <MenuItemButton
              onClick={() => {
                close();
                triggerAddVideo();
              }}
            >
              <MenuItemText
                title={t("actions.upload_video.label")}
                titleColor="glyph-secondary"
              />
            </MenuItemButton>
          </MenuItem>
          <MenuItem>
            <MenuItemButton
              onClick={() => {
                close();
                openImageToVideoModal();
              }}
            >
              <MenuItemText
                title={t("actions.generate_with_ai.label")}
                titleColor="glyph-secondary"
              />
            </MenuItemButton>
          </MenuItem>
        </MenuList>
      )}
    </Menu>
  );
}
