import { useSheetImageInputs } from "@domains/scriptProject/useSheetImageInputs";
import { ErrorTrackStatus } from "@home/components/status/ErrorTrackStatus";
import { useMountEffect } from "@hooks/useMountEffect";

type Props = {
  clipId: string;
};

export const SheetImageRenderError: React.FC<Props> = ({ clipId }) => {
  const { data: renderStatus, refetch: refetchRenderStatus } =
    useSheetImageInputs(clipId);
  useMountEffect(() => {
    void refetchRenderStatus();
  });
  const errorMessage =
    renderStatus?.error_message ?? renderStatus?.data?.error_message;

  return <ErrorTrackStatus errorMessage={errorMessage ?? undefined} />;
};
