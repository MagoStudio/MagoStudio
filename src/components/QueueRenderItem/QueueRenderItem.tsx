import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { ProgressBar } from "@components/ProgressBar";
import { Text } from "@components/Text";
import { AssetStatus } from "@schemas/asset";
import { type GlyphPalette } from "@styles/types";
import { useTranslation } from "react-i18next";

import { formatFalCost } from "@/platform/falPricing";

export type QueueCostUnit = "credits" | "usd" | null;

interface Props {
  layerId?: string;
  projectName: string;
  shotName: string;
  trackName: string;
  status: AssetStatus;
  progress: number;
  frameRange: [number, number];
  cost: number;
  costUnit?: QueueCostUnit;
  statusText: string;
  statusColor: GlyphPalette;
  renderDuration?: string;
  interactedWith?: boolean;
  isCancelable: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

export const QueueRenderItem: React.FC<Props> = ({
  layerId,
  projectName,
  shotName,
  trackName,
  status,
  progress,
  frameRange,
  cost,
  costUnit = "credits",
  statusText,
  statusColor,
  renderDuration,
  interactedWith,
  isCancelable,
  onClick,
  onDelete
}) => {
  const { t } = useTranslation();

  const showProgressBar =
    status === AssetStatus.INPROGRESS ||
    status === AssetStatus.PENDING ||
    status === AssetStatus.INQUEUE;

  const isWaiting =
    status === AssetStatus.PENDING || status === AssetStatus.INQUEUE;

  const secondRowStatusColor = isWaiting ? "glyph-tertiary" : statusColor;

  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={layerId ? `queue-item-${layerId}` : undefined}
      onClick={onClick}
      onKeyDown={handleRowKeyDown}
      className="grid grid-cols-[1fr_auto] items-center gap-2 w-full text-left rounded bg-element-primary pl-3 pr-1.5 py-2 transition-colors hover:bg-element-for-hover active:bg-element-primary-active focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-glyph-secondary"
    >
      <div className="flex flex-col min-w-0 gap-2">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <Text
            variant="sm"
            color="glyph-secondary"
            whiteSpace="nowrap"
            className="shrink-0"
          >
            {projectName}
          </Text>
          <Text variant="sm" color="glyph-secondary" className="shrink-0">
            /
          </Text>
          <Text
            variant="sm"
            color="glyph-secondary"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {shotName}
          </Text>
          <Text variant="sm" color="glyph-secondary" className="shrink-0">
            /
          </Text>
          <Text
            variant="sm"
            color="glyph-secondary"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {trackName}
          </Text>
        </div>

        <div className="flex items-center">
          <div className="flex items-center gap-1 w-[207px] shrink-0">
            {showProgressBar ? (
              <>
                <Text
                  variant="2xs"
                  color={secondRowStatusColor}
                  whiteSpace="nowrap"
                >
                  {statusText}
                </Text>
                {progress > 0 && (
                  <div className="w-20">
                    <ProgressBar
                      progress={progress}
                      color={secondRowStatusColor}
                    />
                  </div>
                )}
              </>
            ) : (
              <Text
                variant="2xs"
                color={
                  status === AssetStatus.FINISHED
                    ? "glyph-tertiary"
                    : statusColor
                }
                whiteSpace="nowrap"
              >
                {status === AssetStatus.FINISHED && renderDuration
                  ? t("queue_panel.duration.label", { value: renderDuration })
                  : statusText}
              </Text>
            )}
          </div>

          <Text
            variant="2xs"
            color="glyph-tertiary"
            whiteSpace="nowrap"
            className="w-[207px] shrink-0"
          >
            {t("queue_panel.frame_range.label", {
              start: frameRange[0],
              end: frameRange[1]
            })}
          </Text>

          {costUnit !== null && (
            <Text variant="2xs" color="glyph-tertiary" className="flex-1">
              {t("queue_panel.cost.label", {
                value:
                  costUnit === "usd"
                    ? formatFalCost(cost)
                    : `${Math.round(cost)} credits`
              })}
            </Text>
          )}
        </div>
      </div>

      <div
        className="shrink-0 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {status === AssetStatus.FINISHED && interactedWith === false && (
          <svg
            data-testid="queue-item-unviewed-dot"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <g opacity="0.3" filter="url(#filter0_f_10657_1914)">
              <path
                d="M16 10C16 13.3137 13.3137 16 10 16C6.68629 16 4 13.3137 4 10C4 6.68629 6.68629 4 10 4C13.3137 4 16 6.68629 16 10Z"
                className="fill-glyph-success"
              />
            </g>
            <path
              d="M13 10C13 11.6569 11.6569 13 10 13C8.34315 13 7 11.6569 7 10C7 8.34315 8.34315 7 10 7C11.6569 7 13 8.34315 13 10Z"
              className="fill-glyph-success-hover"
            />
            <defs>
              <filter
                id="filter0_f_10657_1914"
                x="0"
                y="0"
                width="20"
                height="20"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="BackgroundImageFix"
                  result="shape"
                />
                <feGaussianBlur
                  stdDeviation="2"
                  result="effect1_foregroundBlur_10657_1914"
                />
              </filter>
            </defs>
          </svg>
        )}
        {status === AssetStatus.FINISHED || status === AssetStatus.ERROR ? (
          <IconActionButton
            aria-label={t("queue_panel.open_project.label")}
            icon={<Icon iconSet="16" iconName="folder" />}
            onPress={onClick}
          />
        ) : (
          isCancelable && (
            <IconActionButton
              aria-label={t("queue_panel.delete_render.label")}
              icon={<Icon iconSet="16" iconName="delete" />}
              onPress={() => onDelete?.()}
            />
          )
        )}
      </div>
    </div>
  );
};
