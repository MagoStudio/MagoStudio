import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Text } from "@components/Text";
import { cn } from "@utils";

type InfoBlockVariant = "info" | "warning";

type InfoBlockProps = {
  variant?: InfoBlockVariant;
  showIcon?: boolean;
  canClose?: boolean;
  onClose?: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export const InfoBlock: React.FC<InfoBlockProps> = ({
  variant = "info",
  showIcon = true,
  canClose = false,
  onClose,
  action,
  children,
  className
}) => {
  const isMultiLine = !!action;

  return (
    <div
      className={cn(
        "flex gap-1 rounded-[4px] backdrop-blur-[10px] bg-surface-bg-500 border-[0.5px] px-2 py-3",
        isMultiLine ? "flex-col items-start" : "items-center",
        className
      )}
      style={{ borderColor: "rgba(249, 209, 35, 0.16)" }}
      role={variant === "warning" ? "alert" : "status"}
    >
      <div className="flex gap-1 items-start w-full">
        {showIcon && (
          <Icon
            iconSet="24"
            iconName={variant === "warning" ? "warning" : "bulb"}
            className="shrink-0 text-glyph-warning"
          />
        )}
        <div className="flex flex-col justify-center self-stretch flex-1 min-w-0">
          <Text
            component="div"
            variant="sm"
            color="glyph-warning"
            lineHeight="snug"
          >
            {children}
          </Text>
        </div>
        {canClose && (
          <IconActionButton
            aria-label="Dismiss"
            icon={<Icon iconSet="16" iconName="cross" />}
            size="xs"
            onPress={onClose}
            className="shrink-0 text-glyph-warning data-[hovered]:text-glyph-warning-hover data-[pressed]:text-glyph-warning-hover"
          />
        )}
      </div>
      {action && <div className="flex pl-7">{action}</div>}
    </div>
  );
};
