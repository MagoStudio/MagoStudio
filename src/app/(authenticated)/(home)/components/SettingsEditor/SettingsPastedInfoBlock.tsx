import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { isSettingsPastedInfoBlockVisibleAtom } from "@store/atoms";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

export const SettingsPastedInfoBlock: React.FC = () => {
  const { t } = useTranslation();
  const isVisible = useAtomValue(isSettingsPastedInfoBlockVisibleAtom);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="flex flex-col items-center gap-2 px-6 py-8 rounded-[20px] bg-surface-bg-400 backdrop-blur-[10px]">
        <Icon
          iconSet="pixels"
          iconName="checkmark"
          className="h-10 w-10 text-glyph-success"
        />
        <Text color="glyph-success" variant="sm" weight="bold">
          {t("notifications.settings_pasted.description")}
        </Text>
      </div>
    </div>
  );
};
