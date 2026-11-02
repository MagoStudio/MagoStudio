import { CreditCoin } from "@components/CreditCoin";
import { Text } from "@components/Text";

export type ScriptProjectRenderCost =
  | { kind: "credits"; amount: number }
  | { kind: "local" }
  | null;

type Props = {
  cost: ScriptProjectRenderCost;
  isDisabled: boolean;
};

export const RenderCostLabel: React.FC<Props> = ({ cost, isDisabled }) => {
  if (!cost) return null;

  if (cost.kind === "local") {
    return (
      <Text component="span" variant="sm" color="glyph-secondary">
        Local
      </Text>
    );
  }

  return (
    <CreditCoin
      count={cost.amount}
      disabled={isDisabled}
      marginLeft
      monochrome
    />
  );
};
