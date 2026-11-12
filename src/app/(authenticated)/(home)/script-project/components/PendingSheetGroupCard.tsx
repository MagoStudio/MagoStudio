import { Skeleton } from "@components/Skeleton";
import { Text } from "@components/Text";

type Props = {
  name: string;
  token: string;
};

export const PendingSheetGroupCard: React.FC<Props> = ({ name, token }) => (
  <div
    className="flex flex-col gap-3 rounded-2xl border border-element-primary bg-surface-secondary p-4"
    data-testid={`sheet-group-pending-${token}`}
  >
    <Text variant="md" weight="semibold">
      {name}
    </Text>
    <Skeleton variant="rounded" height={88} />
    <Skeleton variant="rounded" height={64} />
    <div className="flex gap-2">
      <Skeleton variant="rounded" className="w-48" height={192} />
      <Skeleton variant="rounded" className="w-48" height={192} />
    </div>
  </div>
);
