import { MaskPreviewPoint, maskPreviewToolAtom } from "@store/maskPreviewStore";
import { useAtomValue } from "jotai";

const CLICK_DELETE_THRESHOLD = 0.03;

interface UseMaskPointInteractionParams {
  points: MaskPreviewPoint[];
  setPoints: (points: MaskPreviewPoint[]) => void;
}

export const useMaskPointInteraction = ({
  points,
  setPoints
}: UseMaskPointInteractionParams) => {
  const activeTool = useAtomValue(maskPreviewToolAtom);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const normalizedX = (e.clientX - rect.left) / rect.width;
    const normalizedY = (e.clientY - rect.top) / rect.height;

    const existingIdx = points.findIndex((p) => {
      const dx = p.x - normalizedX;
      const dy = p.y - normalizedY;
      return Math.sqrt(dx * dx + dy * dy) < CLICK_DELETE_THRESHOLD;
    });

    if (existingIdx >= 0) {
      setPoints(points.filter((_, i) => i !== existingIdx));
      return;
    }

    setPoints([
      ...points,
      {
        x: normalizedX,
        y: normalizedY,
        label: activeTool === "add" ? 1 : 0
      }
    ]);
  };

  return { handleClick };
};
