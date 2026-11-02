import { Text } from "@components/Text";

interface Props {
  description?: string;
  expiration?: string;
  kicker?: string;
  subtitle?: string;
  title?: string | number;
}

export const PaymentCardHeader: React.FC<Props> = ({
  description,
  expiration,
  kicker,
  subtitle,
  title
}) => {
  return (
    <div className="flex flex-col gap-2">
      {title && (
        <div className="flex items-baseline gap-2">
          <Text color="glyph-primary" select="none" variant="xl" weight="bold">
            {title}
          </Text>
          {kicker && (
            <Text color="glyph-primary" select="none" variant="xs">
              {kicker}
            </Text>
          )}
        </div>
      )}

      <div className="min-h-5">
        {subtitle && (
          <Text
            color="glyph-action-main"
            select="none"
            variant="sm"
            weight="bold"
          >
            {subtitle}
          </Text>
        )}
      </div>

      {description && (
        <Text color="glyph-primary" select="none" variant="sm">
          {description}
        </Text>
      )}

      {expiration && (
        <Text color="glyph-error" select="none" variant="sm">
          {expiration}
        </Text>
      )}
    </div>
  );
};
