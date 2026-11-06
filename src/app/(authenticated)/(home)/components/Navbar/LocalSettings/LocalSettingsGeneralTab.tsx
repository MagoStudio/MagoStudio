import { Divider } from "@components/Divider";
import { GhostButton } from "@components/GhostButton";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import type { LibraryInfo } from "../../../../../../../desktop/shared/contracts";
import { LocalSetupDebugSetting } from "../LocalSetupDebugSetting";

import { LanguageSetting } from "./LanguageSetting";
import { SceneTimelineVisibilitySetting } from "./SceneTimelineVisibilitySetting";

type Props = {
  library: LibraryInfo | null;
  libraryError: string | null;
  onChooseLibrary: () => void;
  onRevealLibrary: () => void;
};

export const LocalSettingsGeneralTab = ({
  library,
  libraryError,
  onChooseLibrary,
  onRevealLibrary
}: Props) => {
  const { t } = useTranslation();

  return (
    <>
      <LanguageSetting />
      <Divider className="bg-glyph-stroke" aria-hidden="true" />
      <div className="flex flex-col gap-2">
        <Text variant="sm" weight="bold">
          {t("localSettings.general.heading")}
        </Text>
        <Text variant="xs" color="glyph-secondary" className="break-all">
          {library?.rootPath ?? t("localSettings.general.noLibrary")}
        </Text>
        {libraryError && (
          <Text variant="xs" color="glyph-error">
            {libraryError}
          </Text>
        )}
        <div className="flex gap-2">
          <GhostButton onPress={onChooseLibrary}>
            {library
              ? t("localSettings.general.changeFolder")
              : t("localSettings.general.chooseFolder")}
          </GhostButton>
          {library && (
            <GhostButton onPress={onRevealLibrary}>
              {t("localSettings.general.showInFolder")}
            </GhostButton>
          )}
        </div>
        <Text variant="2xs" color="glyph-tertiary">
          {t("localSettings.general.description")}
        </Text>
      </div>
      <Divider className="bg-glyph-stroke" aria-hidden="true" />
      <SceneTimelineVisibilitySetting />
      <Divider className="bg-glyph-stroke" aria-hidden="true" />
      <div className="flex flex-col gap-2">
        <Text variant="sm" weight="bold">
          {t("localSettings.general.advancedHeading")}
        </Text>
        <LocalSetupDebugSetting />
      </div>
    </>
  );
};
