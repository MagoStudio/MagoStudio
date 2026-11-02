import { Icon } from "@components/Icon";
import { cn } from "@utils";

type Props = {
  severity: "warning" | "error";
  children: React.ReactNode;
};

export const SceneNoticeCard: React.FC<Props> = ({ severity, children }) => (
  <div
    className="flex items-start gap-2 rounded-lg border border-element-primary bg-surface-secondary px-3 py-2"
    data-testid={`scene-notice-${severity}`}
  >
    <Icon
      iconSet="16-filled"
      iconName={severity === "warning" ? "warning" : "error"}
      className={cn(
        "mt-px shrink-0",
        severity === "warning" ? "text-glyph-warning" : "text-glyph-error"
      )}
    />
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);
