import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { useTranslation } from "react-i18next";

type Props = {
  isAppSidebarCollapsed: boolean;
  onToggle: () => void;
};

export const SidebarCollapseToggle: React.FC<Props> = ({
  isAppSidebarCollapsed,
  onToggle
}) => {
  const { t } = useTranslation();

  return (
    <IconActionButton
      aria-label={
        isAppSidebarCollapsed
          ? t("app_sidebar.expand.label")
          : t("app_sidebar.collapse.label")
      }
      aria-expanded={!isAppSidebarCollapsed}
      icon={
        <Icon
          iconSet="16"
          iconName={isAppSidebarCollapsed ? "chevron-right" : "chevron-left"}
        />
      }
      size="xs"
      variant="dark"
      onPress={onToggle}
    />
  );
};
