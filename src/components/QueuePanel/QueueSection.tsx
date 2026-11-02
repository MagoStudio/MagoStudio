import { Text } from "@components/Text";
import { type QueueItem } from "@hooks/queue/interface";

import { ConnectedQueueRenderItem } from "./ConnectedQueueRenderItem";

interface QueueSectionProps {
  title: string;
  emptyText?: string;
  subtitle?: string;
  items: QueueItem[] | undefined;
  onClose: () => void;
}

export const QueueSection: React.FC<QueueSectionProps> = ({
  title,
  emptyText,
  subtitle,
  items,
  onClose
}) => {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="sm" weight="bold" color="glyph-primary">
        {title}
      </Text>
      {subtitle && (
        <Text variant="sm" color="glyph-tertiary">
          {subtitle}
        </Text>
      )}
      {(!items || items.length === 0) && emptyText && (
        <Text variant="sm" color="glyph-tertiary">
          {emptyText}
        </Text>
      )}
      {items && items.length > 0 && (
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <ConnectedQueueRenderItem
              key={item.id}
              item={item}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </div>
  );
};
