import { Dropdown } from "@components/Dropdown";
import { Text } from "@components/Text";
import { SEQUENTIAL_OPENING_FRAMES } from "@domains/scriptProject/constants";
import { SequentialOpeningFrame } from "@schemas/scriptProject";
import { useTranslation } from "react-i18next";

type Props = {
  openingFrame: SequentialOpeningFrame;
  isDisabled: boolean;
  onChange: (nextOpeningFrame: SequentialOpeningFrame) => void;
  testId?: string;
};

export const ShotSequentialOpeningFrameDropdown: React.FC<Props> = ({
  openingFrame,
  isDisabled,
  onChange,
  testId
}) => {
  const { t } = useTranslation();

  return (
    <label className="flex flex-col gap-1">
      <Text variant="xs" color="glyph-secondary">
        {t("script_project.sequential_opening_frame_input.label")}
      </Text>
      <Dropdown
        aria-label={t("script_project.sequential_opening_frame_input.label")}
        isDisabled={isDisabled}
        selectedKey={openingFrame}
        items={SEQUENTIAL_OPENING_FRAMES.map((value) => ({
          key: value,
          label: t(`script_project.sequential_opening_frame_${value}.label`)
        }))}
        onSelectionChange={(key) =>
          onChange(String(key) as SequentialOpeningFrame)
        }
        data-testid={testId}
      />
    </label>
  );
};
