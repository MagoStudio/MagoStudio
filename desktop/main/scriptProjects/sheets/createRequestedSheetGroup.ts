import { randomUUID } from "node:crypto";

import type { LocalSheetGroupToCreate } from "../../../shared/contracts";

type JsonRecord = Record<string, unknown>;

const MAX_SHEET_GROUP_NAME_LENGTH = 200;

export const createRequestedSheetGroup = ({
  existingKeys,
  requestedTokens,
  sheetGroupToCreate,
  prompt
}: {
  existingKeys: JsonRecord[];
  requestedTokens: string[] | undefined;
  sheetGroupToCreate: LocalSheetGroupToCreate | undefined;
  prompt: unknown;
}): JsonRecord | null => {
  if (!sheetGroupToCreate || requestedTokens?.length !== 1) return null;
  const [requestedToken] = requestedTokens;
  const isRequestedTokenAlreadyAGroup = existingKeys.some(
    (key) => key.token === requestedToken
  );
  if (!requestedToken || isRequestedTokenAlreadyAGroup) return null;
  const highestExistingLayerOrder = Math.max(
    -1,
    ...existingKeys.map((key) => Number(key.layer_order ?? 0))
  );
  return {
    token: requestedToken,
    name: (sheetGroupToCreate.name || requestedToken).slice(
      0,
      MAX_SHEET_GROUP_NAME_LENGTH
    ),
    kind: sheetGroupToCreate.kind ?? null,
    description: null,
    seed_description: null,
    prompt: typeof prompt === "string" ? prompt : null,
    enabled: true,
    layer_id: randomUUID(),
    layer_order: highestExistingLayerOrder + 1,
    selected_asset_id: null,
    effective_asset_id: null,
    effective_source: null,
    images: []
  };
};
