import { Skeleton } from "@components/Skeleton";
import { Text } from "@components/Text";

type Props = {
  isLoading?: boolean;
  text?: string;
  title?: string;
};

export const AutoPromptDisclosureSection: React.FC<Props> = ({
  isLoading,
  text,
  title
}: Props) => {
  if (!text && !isLoading) return null;

  return (
    <div>
      {title && (
        <Text
          color="glyph-tertiary"
          decoration="underline"
          select="none"
          variant="sm"
        >
          {title}
        </Text>
      )}
      {isLoading ? (
        <div className="flex flex-col gap-1">
          <Skeleton height="0.8125rem" variant="rounded" width="100%" />
          <Skeleton height="0.8125rem" variant="rounded" width="90%" />
        </div>
      ) : (
        <Text color="glyph-tertiary" variant="sm" whiteSpace="pre-wrap">
          {text}
        </Text>
      )}
    </div>
  );
};
