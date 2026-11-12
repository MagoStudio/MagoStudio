const CHECKERBOARD_SQUARE_SIZE_PX = 16;
const CHECKERBOARD_LIGHT_SQUARE_COLOR = "#ffffff";
const CHECKERBOARD_DARK_SQUARE_COLOR = "#cccccc";

export const drawCheckerboard = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.fillStyle = CHECKERBOARD_LIGHT_SQUARE_COLOR;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = CHECKERBOARD_DARK_SQUARE_COLOR;

  for (let top = 0; top < height; top += CHECKERBOARD_SQUARE_SIZE_PX) {
    const rowIndex = top / CHECKERBOARD_SQUARE_SIZE_PX;
    const firstDarkSquareLeft =
      rowIndex % 2 === 0 ? CHECKERBOARD_SQUARE_SIZE_PX : 0;
    for (
      let left = firstDarkSquareLeft;
      left < width;
      left += CHECKERBOARD_SQUARE_SIZE_PX * 2
    ) {
      ctx.fillRect(
        left,
        top,
        CHECKERBOARD_SQUARE_SIZE_PX,
        CHECKERBOARD_SQUARE_SIZE_PX
      );
    }
  }
};
