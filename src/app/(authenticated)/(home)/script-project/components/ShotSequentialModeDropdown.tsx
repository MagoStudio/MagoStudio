import { Dropdown } from "@components/Dropdown";
import { Text } from "@components/Text";
import {
  SEQUENTIAL_CONTINUATION_OFF,
  SEQUENTIAL_SHOT_MODES
} from "@domains/scriptProject/constants";
import { SequentialContinuation } from "@domains/scriptProject/utils/withSequentialContinuation";
import { useTranslation } from "react-i18next";

type Props = {
  continuation: SequentialContinuation;
  isDisabled: boolean;
  onChange: (nextContinuation: SequentialContinuation) => void;
  testId?: string;
};

const SEQUENTIAL_CONTINUATIONS: SequentialContinuation[] = [
  SEQUENTIAL_CONTINUATION_OFF,
  ...SEQUENTIAL_SHOT_MODES
];

export const ShotSequentialModeDropdown: React.FC<Props> = ({
  continuation,
  isDisabled,
  onChange,
  testId
}) => {
  const { t } = useTranslation();

  return (
    <label className="flex flex-col gap-1">
      <Text variant="xs" color="glyph-secondary">
        {t("script_project.sequential_mode_input.label")}
      </Text>
      <Dropdown
        aria-label={t("script_project.sequential_mode_input.label")}
        isDisabled={isDisabled}
        selectedKey={continuation}
        items={SEQUENTIAL_CONTINUATIONS.map((sequentialContinuation) => ({
          key: sequentialContinuation,
          label: t(
            `script_project.sequential_mode_${sequentialContinuation}.label`
          )
        }))}
        onSelectionChange={(key) =>
          onChange(String(key) as SequentialContinuation)
        }
        data-testid={testId}
      />
    </label>
  );
};
