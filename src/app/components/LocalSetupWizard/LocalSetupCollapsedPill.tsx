import { LinearProgress } from "@components/LinearProgress";
import { Text } from "@components/Text";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

const PERCENTAGE_SCALE = 100;

export const LocalSetupCollapsedPill = ({
  percentage,
  onExpand
}: {
  percentage?: number;
  onExpand: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <AriaButton
      className="flex cursor-pointer items-center gap-3 overflow-hidden rounded-full border border-element-tertiary-active bg-surface-bg-100 py-5 pl-5 pr-6 data-[hovered]:brightness-125"
      onPress={onExpand}
    >
      {percentage === undefined ? null : (
        <LinearProgress
          size="md"
          value={percentage}
          totalValue={PERCENTAGE_SCALE}
          color="element-tertiary-active"
          className="min-w-10 w-10 flex-none rounded bg-element-on-image"
        />
      )}

      <Text component="span" variant="md">
        {percentage === undefined
          ? t("localSetup.pill.label", { defaultValue: "Local setup" })
          : t("localSetup.pill.labelWithProgress", {
              defaultValue: "Local setup {{percentage}}%",
              percentage
            })}
      </Text>
    </AriaButton>
  );
};
