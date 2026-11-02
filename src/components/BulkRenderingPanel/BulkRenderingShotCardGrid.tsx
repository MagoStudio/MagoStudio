import { BulkRenderingShotCardContainer } from "./BulkRenderingShotCardContainer";
import { BulkRenderingShotCardSource, BulkRenderingStepId } from "./types";

interface Props {
  shots: BulkRenderingShotCardSource[];
  stepId: BulkRenderingStepId;
  isImageResultLoading: boolean;
}

export const BulkRenderingShotCardGrid: React.FC<Props> = ({
  shots,
  stepId,
  isImageResultLoading
}) => {
  return (
    <div className="flex w-full flex-wrap gap-5">
      {shots.map((shot) => (
        <BulkRenderingShotCardContainer
          key={shot.shotId}
          shot={shot}
          isVideoStep={stepId === "video"}
          isImageResultLoading={isImageResultLoading}
        />
      ))}
    </div>
  );
};
