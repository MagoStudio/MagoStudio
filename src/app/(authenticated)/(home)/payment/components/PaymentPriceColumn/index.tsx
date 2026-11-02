import { Text } from "@components/Text";

interface Props {
  price?: string;
}

export const PaymentPriceColumn: React.FC<Props> = ({ price }) => {
  return (
    <div className="flex flex-col shrink-0 gap-2 w-3/12 whitespace-nowrap">
      {price && (
        <Text
          align="right"
          color="glyph-primary"
          select="none"
          variant="xl"
          weight="bold"
        >
          {price}
        </Text>
      )}
    </div>
  );
};
