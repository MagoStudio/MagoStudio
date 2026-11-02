import { Checkbox } from "@components/Checkbox";
import { Text } from "@components/Text";
import { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { cn } from "@utils";

const INDENT_PX_PER_LEVEL = 24;
const BASE_INDENT_PX = 8;

interface Props {
  shot: ShotFolderOrShot;
  depth: number;
  thumbnailUrl?: string;
  selected: boolean;
  onToggle: (id: string) => void;
}

export const PlanShotTreeItem: React.FC<Props> = ({
  shot,
  depth,
  thumbnailUrl,
  selected,
  onToggle
}) => {
  const indentPx = depth * INDENT_PX_PER_LEVEL + BASE_INDENT_PX;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggle(shot.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(shot.id);
        }
      }}
      className={cn(
        "group flex flex-row items-center gap-4 pr-2 w-full rounded border border-transparent text-glyph-secondary select-none cursor-pointer hover:text-glyph-primary hover:bg-element-primary-active",
        selected && "border-glyph-action-main"
      )}
      style={{ paddingLeft: indentPx }}
      data-shots-row="shot"
      data-selected={selected ? "true" : undefined}
    >
      <Checkbox isChecked={selected} />
      <div className="flex flex-row items-center justify-start py-1.5 gap-4 min-w-0 flex-1">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            className="h-8 w-[57px] rounded object-cover shrink-0"
          />
        )}
        <Text
          color="inherit"
          component="span"
          variant="sm"
          className="min-w-0 flex-1 truncate text-left"
        >
          {shot.name}
        </Text>
      </div>
    </div>
  );
};
