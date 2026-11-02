import { deflateSync } from "node:zlib";

const WIDTH = 1536;
const HEIGHT = 864;
const ASPECTS = ["16:9", "9:16", "4:3", "3:4", "1:1"].map((value) =>
  value.split(":").map(Number)
);
const MAX_PANELS = 15;
const MARGIN = 40;
const GUTTER = 32;
const NUMBER_BAND = 52;
const BORDER = 6;
const CIRCLE_RADIUS = 21;
const CIRCLE_BORDER = 4;
const CIRCLE_OFFSET_X = 22;
const CIRCLE_OFFSET_Y = 28;
const DIGIT_COLUMNS = 3;
const DIGIT_ROWS = 5;
const DIGIT_SCALE_X = 4;
const DIGIT_SCALE_Y = 5;
const BYTE_BITS = 8;
const UINT32_BYTES = 4;
const CRC_MASK = 4294967295;
const CRC_POLYNOMIAL = 3988292384;
const RGB_CHANNELS = 3;
const WHITE_CHANNEL = 255;
const PNG_HEADER_BYTES = 13;
const PNG_RGB_TYPE = 2;
const DIGITS = [
  "111101101101111",
  "010110010010111",
  "111001111100111",
  "111001111001111",
  "101101111001001",
  "111100111001111",
  "111100111101111",
  "111001001001001",
  "111101111101111",
  "111101111001111"
];

export const templateLayout = (count: number, size: unknown[]) => {
  if (!Number.isInteger(count) || count < 1 || count > MAX_PANELS)
    throw new Error("A storyboard needs 1 to 15 panels");
  const ratio = Number(size[0]) / Number(size[1]);
  const validRatio =
    Number.isFinite(ratio) && ratio > 0 ? ratio : ASPECTS[1][0] / ASPECTS[1][1];
  const [aw, ah] = [...ASPECTS].sort(
    (a, b) =>
      Math.abs(Math.log(validRatio / (a[0]! / a[1]!))) -
      Math.abs(Math.log(validRatio / (b[0]! / b[1]!)))
  )[0]!;
  const panelRatio = aw! / ah!;
  const grids = Array.from({ length: count }, (_, i) => {
    const columns = i + 1,
      rows = Math.ceil(count / columns);
    const w = Math.min(WIDTH / HEIGHT / columns, panelRatio / rows);
    return {
      columns,
      rows,
      area: (w * w) / panelRatio,
      empty: columns * rows - count
    };
  }).sort(
    (a, b) => b.area - a.area || a.empty - b.empty || b.columns - a.columns
  );
  const { columns, rows } = grids[0]!;
  const cellW = (WIDTH - 2 * MARGIN - (columns - 1) * GUTTER) / columns;
  const cellH = (HEIGHT - 2 * MARGIN - (rows - 1) * GUTTER) / rows;
  const w = Math.floor(Math.min(cellW, (cellH - NUMBER_BAND) * panelRatio));
  const h = Math.floor(w / panelRatio);
  const left = Math.floor((WIDTH - (columns * w + (columns - 1) * GUTTER)) / 2);
  const top = Math.floor(
    (HEIGHT - (rows * (h + NUMBER_BAND) + (rows - 1) * GUTTER)) / 2
  );
  return {
    columns,
    rows,
    aspect: `${aw}:${ah}`,
    orientation: aw === ah ? "square" : aw! > ah! ? "landscape" : "portrait",
    panels: Array.from({ length: count }, (_, i) => ({
      left: left + (i % columns) * (w + GUTTER),
      top:
        top +
        Math.floor(i / columns) * (h + GUTTER + NUMBER_BAND) +
        NUMBER_BAND,
      width: w,
      height: h
    }))
  };
};

const crc = (bytes: Buffer) => {
  let value = CRC_MASK;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < BYTE_BITS; bit++)
      value = (value >>> 1) ^ (value & 1 ? CRC_POLYNOMIAL : 0);
  }
  return (value ^ CRC_MASK) >>> 0;
};
const chunk = (name: string, data: Buffer) => {
  const type = Buffer.from(name),
    len = Buffer.alloc(UINT32_BYTES),
    check = Buffer.alloc(UINT32_BYTES);
  len.writeUInt32BE(data.length);
  check.writeUInt32BE(crc(Buffer.concat([type, data])));
  return Buffer.concat([len, type, data, check]);
};

export const templatePng = (count: number, size: unknown[]): Buffer => {
  const layout = templateLayout(count, size);
  const scanline = WIDTH * RGB_CHANNELS + 1;
  const pixels = Buffer.alloc(scanline * HEIGHT, WHITE_CHANNEL);
  for (let y = 0; y < HEIGHT; y++) pixels[y * scanline] = 0;
  const ink = (x: number, y: number) => {
    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT)
      pixels.fill(
        0,
        y * scanline + 1 + x * RGB_CHANNELS,
        y * scanline + 1 + (x + 1) * RGB_CHANNELS
      );
  };
  layout.panels.forEach((panel, index) => {
    for (let y = panel.top; y < panel.top + panel.height; y++)
      for (let x = panel.left; x < panel.left + panel.width; x++)
        if (
          x < panel.left + BORDER ||
          x >= panel.left + panel.width - BORDER ||
          y < panel.top + BORDER ||
          y >= panel.top + panel.height - BORDER
        )
          ink(x, y);
    const cx = panel.left + CIRCLE_OFFSET_X,
      cy = panel.top - CIRCLE_OFFSET_Y;
    for (let y = cy - CIRCLE_RADIUS; y <= cy + CIRCLE_RADIUS; y++)
      for (let x = cx - CIRCLE_RADIUS; x <= cx + CIRCLE_RADIUS; x++) {
        const r = Math.hypot(x - cx, y - cy);
        if (r >= CIRCLE_RADIUS - CIRCLE_BORDER && r <= CIRCLE_RADIUS) ink(x, y);
      }
    const digits = String(index + 1);
    digits.split("").forEach((digit, digitIndex) =>
      DIGITS[Number(digit)]!.split("").forEach((value, i) => {
        if (value !== "1") return;
        for (let y = 0; y < DIGIT_SCALE_Y; y++)
          for (let x = 0; x < DIGIT_SCALE_X; x++)
            ink(
              cx -
                (digits.length * ((DIGIT_COLUMNS + 1) * DIGIT_SCALE_X)) / 2 +
                digitIndex * ((DIGIT_COLUMNS + 1) * DIGIT_SCALE_X) +
                (i % DIGIT_COLUMNS) * DIGIT_SCALE_X +
                x,
              cy -
                Math.floor((DIGIT_ROWS * DIGIT_SCALE_Y) / 2) +
                Math.floor(i / DIGIT_COLUMNS) * DIGIT_SCALE_Y +
                y
            );
      })
    );
  });
  const header = Buffer.alloc(PNG_HEADER_BYTES);
  header.writeUInt32BE(WIDTH);
  header.writeUInt32BE(HEIGHT, UINT32_BYTES);
  header[8] = BYTE_BITS;
  header[9] = PNG_RGB_TYPE;
  return Buffer.concat([
    Buffer.from("\x89PNG\r\n\x1a\n", "latin1"),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0))
  ]);
};
