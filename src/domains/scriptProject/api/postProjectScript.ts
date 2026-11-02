import {
  ScriptCastCreated,
  ScriptCastCreatedSchema
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

export type CastProjectScriptRequest = {
  projectId: string;
  script: string;
  maxShots?: number;
  /** Split each sequence into camera-setup beats, one Shot per beat, each with its own
   * calibrated length. Omitted rather than sent as `false`, so a project cast before this
   * existed reads identically on the wire. */
  isAtomicShotsRequested?: boolean;
  /** Apply the casting model's continuity recommendations to the resulting shots. */
  isSequentialShotsRequested?: boolean;
  /** Let recurring cast entities have distinct design variants. */
  isCharacterDesignVersionsRequested?: boolean;
  isSeparateStyleRequested?: boolean;
  isSeparateCameraRequested?: boolean;
  targetDurationS?: number;
};

export const postProjectScript = async ({
  projectId,
  script,
  maxShots,
  isAtomicShotsRequested,
  targetDurationS
}: CastProjectScriptRequest): Promise<ScriptCastCreated> => {
  const response = await backendApiClient.post(
    `/projects/${projectId}/script`,
    {
      script,
      ...(maxShots === undefined ? {} : { max_shots: maxShots }),
      ...(isAtomicShotsRequested ? { atomic_shots: true } : {}),
      ...(targetDurationS === undefined
        ? {}
        : { target_duration_s: targetDurationS })
    }
  );
  return ScriptCastCreatedSchema.parse(response.data);
};
