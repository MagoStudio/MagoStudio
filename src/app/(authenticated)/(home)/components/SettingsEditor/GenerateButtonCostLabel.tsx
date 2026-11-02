import { CreditCoin } from "@components/CreditCoin";
import { Text } from "@components/Text";

import { RenderProvider } from "@/platform/modelProviders";

type Props = {
  renderProvider: RenderProvider | null;
  formattedCreditCost: string;
  isUnlimitedModeActive: boolean;
  isGenerateButtonDisabled: boolean;
};

export const GenerateButtonCostLabel: React.FC<Props> = ({
  renderProvider,
  formattedCreditCost,
  isUnlimitedModeActive,
  isGenerateButtonDisabled
}) => {
  if (renderProvider === "local-comfy") {
    return (
      <Text
        component="span"
        variant="xs"
        color="inherit"
        className="ml-2 opacity-70"
      >
        Local
      </Text>
    );
  }
  if (isUnlimitedModeActive) return null;
  return (
    <CreditCoin
      count={formattedCreditCost}
      disabled={isGenerateButtonDisabled}
      marginLeft
      monochrome
    />
  );
};
