import {
  AgentScreenplayElement,
  AgentScreenplayScene
} from "@schemas/scriptProject";

import { wrapTextToWidth } from "./wrapTextToWidth";

const ELEMENT_SEPARATOR = "\n\n";
const SCENE_SEPARATOR = "\n\n";

const CHARACTER_CUE_INDENT = 22;
const PARENTHETICAL_INDENT = 16;
const PARENTHETICAL_WIDTH = 25;
const DIALOGUE_INDENT = 10;
const DIALOGUE_WIDTH = 35;
const TRANSITION_RIGHT_EDGE_COLUMN = DIALOGUE_INDENT + DIALOGUE_WIDTH;

const indentLines = (lines: string[], indent: number): string =>
  lines.map((line) => `${" ".repeat(indent)}${line}`).join("\n");

const stripSurroundingParentheses = (text: string): string =>
  text
    .trim()
    .replace(/^\(\s*/, "")
    .replace(/\s*\)$/, "");

const formatCharacterCue = (character: string, extension: string): string => {
  const cue = extension
    ? `${character.toUpperCase()} (${extension.toUpperCase()})`
    : character.toUpperCase();
  return indentLines([cue], CHARACTER_CUE_INDENT);
};

const formatDialogueBlock = ({
  character,
  extension,
  parenthetical,
  line
}: {
  character: string;
  extension: string;
  parenthetical: string;
  line: string;
}): string =>
  [
    formatCharacterCue(character, extension),
    parenthetical
      ? indentLines(
          wrapTextToWidth(`(${parenthetical})`, PARENTHETICAL_WIDTH),
          PARENTHETICAL_INDENT
        )
      : "",
    indentLines(wrapTextToWidth(line, DIALOGUE_WIDTH), DIALOGUE_INDENT)
  ]
    .filter((part) => part.length > 0)
    .join("\n");

const formatScreenplayElement = (element: AgentScreenplayElement): string => {
  const elementType = element.type.trim().toLowerCase();
  const text = element.text.trim();
  if (!text) return "";

  const character = element.character?.trim() ?? "";
  const isDialogueWithSpeaker = elementType === "dialogue" && character;
  if (isDialogueWithSpeaker) {
    return formatDialogueBlock({
      character,
      extension: stripSurroundingParentheses(element.extension ?? ""),
      parenthetical: stripSurroundingParentheses(element.parenthetical ?? ""),
      line: text
    });
  }

  if (elementType === "camera") {
    return text.toUpperCase();
  }

  if (elementType === "transition") {
    return text.toUpperCase().padStart(TRANSITION_RIGHT_EDGE_COLUMN);
  }

  return text;
};

const formatScreenplayScene = (scene: AgentScreenplayScene): string =>
  [
    scene.heading.trim().toUpperCase(),
    ...scene.elements.map(formatScreenplayElement)
  ]
    .filter((part) => part.length > 0)
    .join(ELEMENT_SEPARATOR);

export const formatScreenplay = (scenes: AgentScreenplayScene[]): string =>
  scenes
    .map(formatScreenplayScene)
    .filter((scene) => scene.length > 0)
    .join(SCENE_SEPARATOR);
