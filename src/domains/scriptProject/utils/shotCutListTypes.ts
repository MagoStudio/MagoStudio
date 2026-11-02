type BeatCameraSentenceKind = "move" | "static" | "none";

export type Beat = {
  framing: string;
  action: string;
  cameraMovement: string;
  cameraSentenceKind: BeatCameraSentenceKind;
  spokenLines: string;
  durationSeconds: number;
};

export type ShotCutList = {
  sceneDescription: string;
  midExchangeOpening: string;
  beats: Beat[];
};
