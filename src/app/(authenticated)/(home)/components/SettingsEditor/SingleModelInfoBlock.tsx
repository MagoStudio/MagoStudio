import { Text } from "@components/Text";

export const SingleModelInfoBlock = ({
  modelLabel
}: {
  modelLabel: string;
}) => (
  <div className="flex min-h-8 w-full min-w-0 items-center rounded bg-element-primary px-2 py-1.5">
    <Text variant="sm" color="glyph-secondary" select="none">
      {modelLabel}
    </Text>
  </div>
);
