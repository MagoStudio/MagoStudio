import {
  DEFAULT_SEQUENTIAL_KEY_FRAMES,
  DEFAULT_SEQUENTIAL_OPENING_FRAME,
  DEFAULT_SEQUENTIAL_SHOT_MODE
} from "@domains/scriptProject/constants";
import {
  SequentialOpeningFrame,
  SequentialShotConfig,
  SequentialShotMode
} from "@schemas/scriptProject";

export type ResolvedSequentialShotConfig = {
  enabled: boolean;
  mode: SequentialShotMode;
  num_select: number;
  prompt_appendix: string;
  opening_frame: SequentialOpeningFrame;
};

export const resolveSequentialShotConfig = (
  sequential: SequentialShotConfig | null | undefined
): ResolvedSequentialShotConfig => ({
  enabled: sequential?.enabled ?? false,
  mode: sequential?.mode ?? DEFAULT_SEQUENTIAL_SHOT_MODE,
  num_select: sequential?.num_select ?? DEFAULT_SEQUENTIAL_KEY_FRAMES,
  prompt_appendix: sequential?.prompt_appendix ?? "",
  opening_frame: sequential?.opening_frame ?? DEFAULT_SEQUENTIAL_OPENING_FRAME
});
