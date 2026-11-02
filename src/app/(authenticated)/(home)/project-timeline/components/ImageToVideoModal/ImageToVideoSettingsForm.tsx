import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";
import { RenderSettingsVideoGroups } from "@models/video/RenderSettingsVideoGroups";
import { VideoSettings } from "@models/video/types";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue, useSetAtom } from "jotai";

import { ImageToVideoEngineSwitcher } from "./ImageToVideoEngineSwitcher";
import { ImageToVideoGenerateBar } from "./ImageToVideoGenerateBar";
import { ImageToVideoResetSettingsButton } from "./ImageToVideoResetSettingsButton";

interface ImageToVideoSettingsFormProps {
  selectedProjectId: string | undefined;
}

export const ImageToVideoSettingsForm: React.FC<
  ImageToVideoSettingsFormProps
> = ({ selectedProjectId }) => {
  const isTeamMember = useIsTeamMember();
  const { renderSettingsValuesAtom, selectedModelAtom, updateValueAtom } =
    useRenderSettingsAtoms();
  const values = useAtomValue(renderSettingsValuesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const updateValue = useSetAtom(updateValueAtom);

  const handleValueChange = (key: string, value: unknown) => {
    const updates = selectedModel.onValueChange?.(key, value, values);
    if (!updates) return;
    Object.entries(updates).forEach(([updateKey, updateVal]) => {
      updateValue({
        key: updateKey as keyof VideoSettings,
        value: updateVal
      });
    });
  };

  return (
    <div className="grid h-full min-h-0 grid-rows-[1fr_auto] w-full">
      <div className="relative flex min-h-0 flex-col gap-4 overflow-y-auto scrollbar-custom p-3">
        <ImageToVideoEngineSwitcher />
        <ImageToVideoResetSettingsButton />
        <RenderSettingsVideoGroups
          groups={selectedModel.settingsGroups}
          values={values}
          isTeamMember={isTeamMember}
          onValueChange={handleValueChange}
          writeVideoSettingValue={updateValue}
        />
      </div>
      <ImageToVideoGenerateBar selectedProjectId={selectedProjectId} />
    </div>
  );
};
