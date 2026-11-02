import { DisclosureIconButton } from "@components/DisclosureIconButton";
import { Text } from "@components/Text";
import { SbsTrackSettingsList } from "@home/components/RenderPreview/SbsComparison/SbsTrackSettingsList";
import { Layer } from "@schemas/layer";
import { cn } from "@utils";
import { Button } from "react-aria-components/Button";
import { Disclosure, DisclosurePanel } from "react-aria-components/Disclosure";

import { SettingsDisplay } from "../types";

type Props = {
  className?: string;
  rightTrack?: Layer;
  leftTrack?: Layer;
  settingsToDisplay?: SettingsDisplay[];
  isDisclosureOpen?: boolean;
  onDisclosureChange?: (open: boolean) => void;
} & React.HTMLAttributes<HTMLDivElement>;

const TrackTitles: React.FC<{
  first?: Layer;
  second?: Layer;
  isExpanded: boolean;
  hasDifferentKeys: boolean;
}> = ({ first, second, isExpanded, hasDifferentKeys }) => {
  const tracks = [first, second];

  return (
    <>
      {tracks.map((track, index) => (
        <div
          key={index}
          className="flex items-center justify-between basis-1/2 overflow-hidden py-1 px-3 select-none"
        >
          <Text
            color="glyph-primary-on-pic"
            overflow="hidden"
            textOverflow="ellipsis"
            variant="sm"
            whiteSpace="nowrap"
          >
            {`${track?.name || "Track not selected"}`}
          </Text>

          {index === 1 && hasDifferentKeys && (
            <DisclosureIconButton
              color="glyph-primary-on-pic"
              open={isExpanded}
              reverse
            />
          )}
        </div>
      ))}
    </>
  );
};
export const SbsComparisonTrackSettings: React.FC<Props> = ({
  className,
  leftTrack,
  rightTrack,
  settingsToDisplay = [],
  isDisclosureOpen,
  onDisclosureChange
}) => {
  const hasDifferentKeys = settingsToDisplay.length > 0;
  const isControlled = isDisclosureOpen !== undefined && onDisclosureChange;

  return (
    <div
      className={cn(
        "absolute z-10 left-0 bottom-0 max-h-[12.5rem] w-full bg-surface-on-image",
        className
      )}
    >
      <Disclosure
        defaultExpanded={isControlled ? undefined : isDisclosureOpen}
        isExpanded={isControlled ? isDisclosureOpen : undefined}
        isDisabled={!hasDifferentKeys}
        onExpandedChange={isControlled ? onDisclosureChange : undefined}
      >
        {({ isExpanded }) => (
          <div>
            <Button
              slot="trigger"
              aria-label="Track settings disclosure button"
              className="flex items-center h-11 w-full border-b border-glyph-invert-main"
            >
              <TrackTitles
                first={leftTrack}
                second={rightTrack}
                isExpanded={isExpanded}
                hasDifferentKeys={hasDifferentKeys}
              />
            </Button>

            {hasDifferentKeys && (
              <DisclosurePanel>
                <SbsTrackSettingsList settingsToDisplay={settingsToDisplay} />
              </DisclosurePanel>
            )}
          </div>
        )}
      </Disclosure>
    </div>
  );
};
