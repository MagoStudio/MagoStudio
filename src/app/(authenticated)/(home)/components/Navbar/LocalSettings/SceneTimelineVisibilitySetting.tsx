import { Switch } from "@components/Switch";
import { Text } from "@components/Text";
import { useSceneTimelineVisibilitySetting } from "@hooks/userLocalStorage/useSceneTimelineVisibilitySetting";
import { useTranslation } from "react-i18next";

export const SceneTimelineVisibilitySetting = () => {
  const { t } = useTranslation();
  const [isSceneTimelineShown, setIsSceneTimelineShown] =
    useSceneTimelineVisibilitySetting();

  return (
    <div className="flex flex-col gap-1">
      <Switch
        label={t("localSettings.general.sceneTimelineLabel")}
        isSelected={isSceneTimelineShown}
        onChange={setIsSceneTimelineShown}
      />
      <Text variant="2xs" color="glyph-tertiary">
        {t("localSettings.general.sceneTimelineDescription")}
      </Text>
    </div>
  );
};
