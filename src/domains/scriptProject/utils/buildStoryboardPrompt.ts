import {
  STORYBOARD_DEFAULT_STYLE_PROMPT,
  STORYBOARD_IMAGE_SIZE
} from "../constants";

import { chooseStoryboardGrid } from "./chooseStoryboardGrid";
import { ScriptProjectAspectRatio } from "./findClosestScriptProjectAspectRatio";
import { Beat, ShotCutList } from "./shotCutListTypes";

const STORYBOARD_SHEET_ASPECT_RATIO =
  STORYBOARD_IMAGE_SIZE.width / STORYBOARD_IMAGE_SIZE.height;

const KEEP_THE_GRID =
  "Draw each panel's content inside the panel with that number, and only inside it. Keep every border, circled number, panel size and position, and the white space between and around the panels exactly as they are in the input image. Draw nothing outside the panels, and never draw over a border or a number.";

const REDRAW_THE_SKETCHES =
  "The director has sketched inside some panels. Redraw those sketches as the storyboard: keep who is where, the framing and the composition of each. Where a sketch and its panel description disagree, follow the sketch.";

const describeCharacterReferences = (characterNames: string[]): string =>
  characterNames.length === 0
    ? ""
    : `The reference images show the characters: ${characterNames.join(", ")}. Draw them as the same crude sketch figures, but recognisable by silhouette, hair and costume.`;

const describeOrientation = ({
  widthUnits,
  heightUnits
}: ScriptProjectAspectRatio): string => {
  if (widthUnits === heightUnits) return "square";
  return widthUnits > heightUnits ? "landscape" : "portrait";
};

const describePanelArrangement = (
  panelCount: number,
  panelAspectRatio: ScriptProjectAspectRatio
): string => {
  if (panelCount === 1) return "centred on the sheet";
  const { columnCount, rowCount } = chooseStoryboardGrid({
    panelCount,
    sheetAspectRatio: STORYBOARD_SHEET_ASPECT_RATIO,
    panelAspectRatio: panelAspectRatio.widthUnits / panelAspectRatio.heightUnits
  });
  if (rowCount === 1) return "side by side in one row";
  const emptyCellCount = columnCount * rowCount - panelCount;
  const emptyCellsSentence =
    emptyCellCount === 0
      ? ""
      : `, with the last ${emptyCellCount === 1 ? "cell" : `${emptyCellCount} cells`} of the bottom row left empty`;
  return `in ${rowCount} rows of ${columnCount}, read left to right, then top to bottom${emptyCellsSentence}`;
};

const describeGridTemplate = (
  panelCount: number,
  panelAspectRatio: ScriptProjectAspectRatio
): string => {
  const panelShape = `${describeOrientation(panelAspectRatio)} ${panelAspectRatio.id}`;
  const panelsDescription =
    panelCount === 1
      ? `1 empty ${panelShape} panel`
      : `${panelCount} empty ${panelShape} panels`;
  return `The input image is a blank storyboard template: ${panelsDescription} ${describePanelArrangement(panelCount, panelAspectRatio)}, each with a thick black border and a circled number (1 to ${panelCount}) just above its top-left corner. ${KEEP_THE_GRID}`;
};

const withoutTrailingPeriod = (text: string): string =>
  text.trim().replace(/\.+$/, "");

const describeStoryboardPanel = (beat: Beat, panelNumber: number): string => {
  const framing = withoutTrailingPeriod(beat.framing);
  const cameraMovement = withoutTrailingPeriod(beat.cameraMovement);
  const cameraDirection = [
    framing,
    cameraMovement ? `camera ${cameraMovement}` : "static camera"
  ]
    .filter(Boolean)
    .join(", ");
  return `Panel ${panelNumber} (${cameraDirection}): ${withoutTrailingPeriod(beat.action)}.`;
};

export const buildStoryboardPrompt = ({
  cutList,
  hasUserSketch,
  panelAspectRatio,
  stylePrompt,
  characterNames
}: {
  cutList: ShotCutList;
  hasUserSketch: boolean;
  panelAspectRatio: ScriptProjectAspectRatio;
  stylePrompt: string;
  characterNames: string[];
}): string => {
  const sceneContext = cutList.sceneDescription.trim();

  return [
    stylePrompt.trim() || STORYBOARD_DEFAULT_STYLE_PROMPT,
    describeGridTemplate(cutList.beats.length, panelAspectRatio),
    hasUserSketch && REDRAW_THE_SKETCHES,
    describeCharacterReferences(characterNames),
    "No other text, captions or speech bubbles anywhere.",
    sceneContext && `The scene: ${sceneContext}`,
    ...cutList.beats.map((beat, beatIndex) =>
      describeStoryboardPanel(beat, beatIndex + 1)
    )
  ]
    .filter(Boolean)
    .join("\n");
};
