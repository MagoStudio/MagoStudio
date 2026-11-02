import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Menu } from "@components/Menu";
import { MenuItem } from "@components/MenuItem";
import { MenuItemButton } from "@components/MenuItemButton";
import { MenuItemText } from "@components/MenuItemText";
import { MenuList } from "@components/MenuList";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

type Props = {
  versionName: string;
  renderedAt: string | null | undefined;
  isReuseSettingsDisabled: boolean;
  onReuseSettings: () => void;
  testId: string;
};

export const ShotVersionMoreMenu: React.FC<Props> = ({
  versionName,
  renderedAt,
  isReuseSettingsDisabled,
  onReuseSettings,
  testId
}) => {
  const { t } = useTranslation();
  return (
    <Menu
      className="flex items-center"
      placement="bottom-end"
      button={
        <IconActionButton
          size="xs"
          variant="onImage"
          icon={<Icon iconSet="16" iconName="menu-dots" />}
          aria-label={t("script_project.version_more_menu_button.label")}
          data-testid={testId}
        />
      }
    >
      {({ close }) => (
        <MenuList>
          <div
            className="flex max-w-60 flex-col gap-0.5 px-2 py-1"
            data-testid={`${testId}-details`}
          >
            <Text variant="xs" color="glyph-secondary" className="truncate">
              {versionName}
            </Text>
            {renderedAt && (
              <Text variant="xs" color="glyph-tertiary">
                {t("script_project.version_rendered_at.label", {
                  timestamp: renderedAt
                })}
              </Text>
            )}
          </div>
          <MenuItem>
            <MenuItemButton
              disabled={isReuseSettingsDisabled}
              onClick={() => {
                close();
                onReuseSettings();
              }}
              data-testid={`${testId}-reuse`}
            >
              <MenuItemText
                title={t("script_project.reuse_settings_button.label")}
                titleColor={
                  isReuseSettingsDisabled ? "glyph-disabled" : "glyph-secondary"
                }
              />
            </MenuItemButton>
          </MenuItem>
        </MenuList>
      )}
    </Menu>
  );
};
