import { Switcher } from "@components/Switcher";
import { useTranslation } from "react-i18next";

import { ScenesLayout } from "./utils/scenesLayout";

type Props = {
  scenesLayout: ScenesLayout;
  onScenesLayoutChange: (layout: ScenesLayout) => void;
};

export const ScenesLayoutSwitcher: React.FC<Props> = ({
  scenesLayout,
  onScenesLayoutChange
}) => {
  const { t } = useTranslation();
  const layoutOptions: { label: string; value: ScenesLayout }[] = [
    {
      label: t("script_project.scenes_interface.layout_cards.label"),
      value: "cards"
    },
    {
      label: t("script_project.scenes_interface.layout_list.label"),
      value: "list"
    }
  ];

  return (
    <div data-testid="scenes-layout-switcher">
      <Switcher
        options={layoutOptions}
        isOptionSelected={(option) => option.value === scenesLayout}
        onOptionClick={(option) => onScenesLayoutChange(option.value)}
      />
    </div>
  );
};
