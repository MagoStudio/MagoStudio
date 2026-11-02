import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Tooltip } from "@components/Tooltip";
import { useTranslation } from "react-i18next";

type Props = {
  onPress: () => void;
};

export const AddProjectFolderButton: React.FC<Props> = ({ onPress }) => {
  const { t } = useTranslation();

  return (
    <Tooltip placement="top" textContent={t("actions.new_folder.label")}>
      <IconActionButton
        aria-label={t("actions.new_folder.label")}
        icon={<Icon iconSet="16" iconName="create-new-folder" />}
        size="sm"
        variant="dark"
        onPress={onPress}
      />
    </Tooltip>
  );
};
