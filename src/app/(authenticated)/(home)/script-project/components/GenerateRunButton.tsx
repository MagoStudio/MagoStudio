import { CircularProgress } from "@components/CircularProgress";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { DRAFT_SAVING_ACTION_ATTRIBUTE } from "@domains/scriptProject/utils/isFocusMovingToDraftSavingAction";
import { useTranslation } from "react-i18next";

import { RenderCostLabel, ScriptProjectRenderCost } from "./RenderCostLabel";

type Props = {
  label: string;
  countLabel: string;
  cost: ScriptProjectRenderCost;
  isDisabled: boolean;
  isPending: boolean;
  isPriceLoading?: boolean;
  onPress: () => void;
  testId: string;
  savesUnsavedDraft?: boolean;
};

export const GenerateRunButton: React.FC<Props> = ({
  label,
  countLabel,
  cost,
  isDisabled,
  isPending,
  isPriceLoading = false,
  onPress,
  testId,
  savesUnsavedDraft = false
}) => {
  const { t } = useTranslation();

  return (
    <MainButton
      colorScheme="primary"
      isDisabled={isDisabled || isPriceLoading}
      loading={isPending}
      onPress={onPress}
      data-testid={testId}
      {...(savesUnsavedDraft
        ? { [DRAFT_SAVING_ACTION_ATTRIBUTE]: "true" }
        : {})}
    >
      <span className="flex items-center gap-1.5">
        {isPriceLoading ? (
          <>
            <CircularProgress
              size="sm"
              color="glyph-disabled"
              data-testid={`${testId}-price-loading`}
            />
            {t("script_project.price_calculating.label")}
          </>
        ) : (
          <>
            {label}
            <Text
              component="span"
              variant="sm"
              color={isDisabled ? "glyph-disabled" : "glyph-secondary"}
            >
              {countLabel}
            </Text>
            <RenderCostLabel cost={cost} isDisabled={isDisabled} />
          </>
        )}
      </span>
    </MainButton>
  );
};
