import { Divider } from "@components/Divider";
import { SettingsGroup } from "@models/shared/types";
import { VideoEngine } from "@models/video/types";
import { Layer } from "@schemas/layer";
import { controlNetDisclosureOpenByModelAtom } from "@store/atoms";
import { useAtomValue } from "jotai";
import { Fragment } from "react";

import {
  RenderSettingsVideoSection,
  WriteVideoSettingValue
} from "./RenderSettingsVideoSection";
import { keyedSections } from "./utils/keyedSections";

export const RenderSettingsVideoGroups = ({
  groups,
  values,
  isDisabled,
  selectedTrack,
  isTeamMember,
  usesMainSectionSpacing,
  onValueChange,
  writeVideoSettingValue,
  errorMessageBySettingKey
}: {
  groups: SettingsGroup[];
  values: any;
  isDisabled?: boolean;
  selectedTrack?: Layer;
  isTeamMember: boolean;
  usesMainSectionSpacing?: boolean;
  onValueChange?: (key: string, value: unknown) => void;
  writeVideoSettingValue: WriteVideoSettingValue;
  errorMessageBySettingKey?: Record<string, string>;
}) => {
  const controlNetDisclosureOpenByModel = useAtomValue(
    controlNetDisclosureOpenByModelAtom
  );
  const isControlNetDisclosureOpen =
    controlNetDisclosureOpenByModel[values.mago_engine as VideoEngine] ?? false;

  return (
    <>
      {keyedSections(groups)
        .filter(({ section }) => {
          const isCollapsedControlNetDetail =
            !!section.isControlNetDetailSetting && !isControlNetDisclosureOpen;
          const isHiddenByRelevance =
            !!section.hidingCondition &&
            section.hidingCondition(values, isTeamMember);

          return !isCollapsedControlNetDetail && !isHiddenByRelevance;
        })
        .map(({ key, section }) => (
          <Fragment key={key}>
            {section.hasSeparatorAbove && (
              <Divider className="my-1 bg-glyph-stroke-2/30" />
            )}
            <RenderSettingsVideoSection
              section={section}
              values={values}
              isDisabled={isDisabled}
              selectedTrack={selectedTrack}
              isTeamMember={isTeamMember}
              usesMainSectionSpacing={usesMainSectionSpacing}
              onValueChange={onValueChange}
              writeVideoSettingValue={writeVideoSettingValue}
              errorMessageBySettingKey={errorMessageBySettingKey}
            />
          </Fragment>
        ))}
    </>
  );
};
