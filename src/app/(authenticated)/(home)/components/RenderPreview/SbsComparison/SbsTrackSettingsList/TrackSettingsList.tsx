import { DisclosureIconButton } from "@components/DisclosureIconButton";
import { Text } from "@components/Text";
import { SettingsDisplay } from "@home/components/RenderPreview/SbsComparison/types";
import { Button } from "react-aria-components/Button";
import { Disclosure, DisclosurePanel } from "react-aria-components/Disclosure";
type Props = {
  oneTrackSettings: SettingsDisplay;
  trackName?: string;
  isDisclosureOpen?: boolean;
  onDisclosureChange?: (open: boolean) => void;
  panelClassName?: string;
};

export const TrackSettingsList: React.FC<Props> = ({ oneTrackSettings }) => {
  const SettingsRows = (
    <div className="flex flex-col gap-y-1.5 ml-3">
      {oneTrackSettings.map(([key, value]) => (
        <div key={`${key}-${value}`} className="flex flex-row w-full last:pb-4">
          <Text color="glyph-primary" variant="sm">
            {`${key}: ${value}`}
          </Text>
        </div>
      ))}
    </div>
  );

  return SettingsRows;
};

export const TrackSettingsListPanel: React.FC<Props> = ({
  oneTrackSettings,
  trackName,
  isDisclosureOpen,
  onDisclosureChange,
  panelClassName
}) => {
  const hasSettings = oneTrackSettings.length > 0;
  const isControlled = isDisclosureOpen !== undefined && !!onDisclosureChange;

  return (
    <div
      className={
        panelClassName ?? "w-full bg-surface-on-image max-h-50 shrink-0"
      }
    >
      <Disclosure
        defaultExpanded={isControlled ? undefined : isDisclosureOpen}
        isExpanded={isControlled ? isDisclosureOpen : undefined}
        isDisabled={!hasSettings}
        onExpandedChange={isControlled ? onDisclosureChange : undefined}
      >
        {({ isExpanded }) => (
          <div>
            <Button
              slot="trigger"
              aria-label="Track settings disclosure button"
              className="flex items-center h-11 w-full border-b border-glyph-invert-main"
            >
              <div className="flex items-center justify-between w-full overflow-hidden py-1 px-3 select-none">
                <Text
                  color="glyph-primary-on-pic"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  variant="sm"
                  whiteSpace="nowrap"
                >
                  {trackName || "Track not selected"}
                </Text>
                {hasSettings && (
                  <DisclosureIconButton
                    color="glyph-primary-on-pic"
                    open={isExpanded}
                    reverse
                  />
                )}
              </div>
            </Button>

            {hasSettings && (
              <DisclosurePanel>
                <div className="py-4 w-full max-h-38 overflow-y-scroll overflow-x-hidden scrollbar-custom">
                  <TrackSettingsList oneTrackSettings={oneTrackSettings} />
                </div>
              </DisclosurePanel>
            )}
          </div>
        )}
      </Disclosure>
    </div>
  );
};
