import { Text } from "@components/Text";

interface Props {
  title: string;
  emptyText: string;
  children?: React.ReactNode;
  hasRows: boolean;
  "data-testid"?: string;
}

export const BulkRenderingPanelSection: React.FC<Props> = ({
  title,
  emptyText,
  children,
  hasRows,
  "data-testid": dataTestId
}) => {
  return (
    <div className="flex flex-col gap-3" data-testid={dataTestId}>
      <Text
        component="h4"
        variant="md"
        weight="bold"
        color="glyph-secondary"
        data-testid={dataTestId && `${dataTestId}-heading`}
      >
        {title}
      </Text>
      {hasRows ? (
        <div className="flex flex-col gap-3">{children}</div>
      ) : (
        <Text
          variant="sm"
          color="glyph-tertiary"
          data-testid={dataTestId && `${dataTestId}-empty`}
        >
          {emptyText}
        </Text>
      )}
    </div>
  );
};
