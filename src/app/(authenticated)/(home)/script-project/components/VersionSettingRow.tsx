import { Text } from "@components/Text";

type Props = {
  label: string;
  children: React.ReactNode;
};

export const VersionSettingRow: React.FC<Props> = ({ label, children }) => {
  return (
    <div className="flex flex-col gap-0.5">
      <Text variant="2xs" color="glyph-tertiary">
        {label}
      </Text>
      {typeof children === "string" ? (
        <Text
          variant="xs"
          color="glyph-secondary"
          whiteSpace="pre-wrap"
          className="break-words"
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </div>
  );
};
