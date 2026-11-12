import { Text } from "@components/Text";

type Props = {
  reason?: string;
  isPending: boolean;
  isPriceLoading?: boolean;
  testId: string;
};

export const NothingToGenerateReason: React.FC<Props> = ({
  reason,
  isPending,
  isPriceLoading = false,
  testId
}) => {
  const shouldShowReason = !!reason && !isPending && !isPriceLoading;
  if (!shouldShowReason) return null;

  return (
    <Text
      variant="xs"
      color="glyph-secondary"
      data-testid={`${testId}-nothing-to-generate`}
    >
      {reason}
    </Text>
  );
};
