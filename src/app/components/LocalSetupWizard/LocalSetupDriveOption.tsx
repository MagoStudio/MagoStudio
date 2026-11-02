import { RadioControl } from "@components/RadioControl";
import { Text } from "@components/Text";
import { cn } from "@utils";
import { Radio } from "react-aria-components";

export const LocalSetupDriveOption = ({
  driveId,
  name,
  freeSpaceLabel,
  hasEnoughRoom
}: {
  driveId: string;
  name: string;
  freeSpaceLabel: string;
  hasEnoughRoom: boolean;
}) => (
  <Radio
    value={driveId}
    className={cn(
      "flex cursor-pointer items-center justify-between gap-2 rounded-lg border p-2",
      "border-element-primary data-[selected]:border-element-tertiary-active"
    )}
  >
    {(renderProps) => (
      <>
        <span className="flex min-w-0 items-center gap-2">
          <RadioControl {...renderProps} />
          <Text component="span" variant="sm">
            {name}
          </Text>
        </span>
        <Text
          component="span"
          variant="sm"
          color={hasEnoughRoom ? "success" : "glyph-secondary"}
        >
          {freeSpaceLabel}
        </Text>
      </>
    )}
  </Radio>
);
