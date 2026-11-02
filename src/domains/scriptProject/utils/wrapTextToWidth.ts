const breakWordToWidth = (word: string, width: number): string[] => {
  const pieces: string[] = [];
  for (let start = 0; start < word.length; start += width) {
    pieces.push(word.slice(start, start + width));
  }
  return pieces;
};

const wrapParagraphToWidth = (paragraph: string, width: number): string[] => {
  const words = paragraph
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .flatMap((word) => breakWordToWidth(word, width));
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const lineWithWord = currentLine ? `${currentLine} ${word}` : word;
    if (lineWithWord.length <= width) {
      currentLine = lineWithWord;
      continue;
    }
    lines.push(currentLine);
    currentLine = word;
  }
  lines.push(currentLine);
  return lines;
};

export const wrapTextToWidth = (text: string, width: number): string[] =>
  text
    .trim()
    .split("\n")
    .filter((paragraph) => paragraph.trim().length > 0)
    .flatMap((paragraph) => wrapParagraphToWidth(paragraph, width));
