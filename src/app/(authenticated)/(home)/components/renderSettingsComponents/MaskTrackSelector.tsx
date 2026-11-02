import { ControlLabel } from "@components/ControlLabel";
import { Dropdown } from "@components/Dropdown";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { isMaskTrack } from "@domains/track/utils/isMaskTrack";
import { AssetStatus } from "@schemas/asset";
import { useTranslation } from "react-i18next";

import { RenderSettingComponentProps } from "./interface";

export const MaskTrackSelector: React.FC<
  RenderSettingComponentProps<string>
> = ({
  setValue,
  value,
  label,
  ariaLabel,
  tooltip,
  tooltipImage,
  isDisabled
}) => {
  const { t } = useTranslation();
  const { data } = useFilteredAndSortedTracks();

  const maskTracks = data.tracks.filter(
    (track) =>
      isMaskTrack(track) &&
      track.clips.some(
        (clip) => clip.asset?.data?.queue_status === AssetStatus.FINISHED
      )
  );

  const noMaskOption = {
    key: "",
    label: t("titles.no_mask.label")
  };
  const items = [
    noMaskOption,
    ...maskTracks.map((track) => ({
      key: track.id,
      label: track.name
    }))
  ];

  const onOptionChange = (key: unknown) => {
    setValue(key as string);
  };

  return (
    <div className="group grid grid-cols-12 gap-4 items-center">
      <div className="col-span-5">
        <ControlLabel labelColor="glyph-tertiary" label={label} />
      </div>
      <div className="col-span-7 flex items-center gap-1 py-0.5 pr-2">
        <div className="flex-1">
          <Dropdown
            aria-label={ariaLabel || label}
            isDisabled={isDisabled}
            onChange={onOptionChange}
            selectedKey={value || ""}
            items={items}
          />
        </div>
        {tooltip && (
          <InfoTooltipIcon
            tooltip={tooltip}
            tooltipImage={tooltipImage}
            labelColor="glyph-tertiary"
          />
        )}
      </div>
    </div>
  );
};
