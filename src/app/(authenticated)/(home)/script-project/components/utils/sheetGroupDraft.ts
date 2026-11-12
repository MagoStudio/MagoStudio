import { SheetKind } from "@schemas/scriptProject";

export type SheetGroupDraft = {
  draftId: string;
  name: string;
  kind: SheetKind;
  prompt: string;
  referenceAssetIds: string[];
  referenceInstruction: string;
};
