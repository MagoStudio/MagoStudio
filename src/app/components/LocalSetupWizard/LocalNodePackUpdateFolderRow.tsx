import { Text } from "@components/Text";

export const LocalNodePackUpdateFolderRow = ({
  label,
  folder
}: {
  label: string;
  folder: string;
}) => (
  <div className="flex flex-col gap-0.5">
    <Text variant="xs" color="glyph-tertiary">
      {label}
    </Text>
    <Text variant="xs" color="glyph-secondary" className="wrap-anywhere">
      {folder}
    </Text>
  </div>
);
