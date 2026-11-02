import {
  ScriptCastCreated,
  ScriptCastCreatedSchema
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocalScriptProject } from "../projectOrigin";

export type CastProjectScriptRequest = {
  projectId: string;
  script: string;
  maxShots?: number;
  isAtomicShotsRequested?: boolean;
  /** Accepted for the shared request type; casting has no such option. */
  isSequentialShotsRequested?: boolean;
  isCharacterDesignVersionsRequested?: boolean;
  isSeparateStyleRequested?: boolean;
  isSeparateCameraRequested?: boolean;
  targetDurationS?: number;
};

/**
 * A local project casts on the desktop with the cloud pipeline's options and
 * defaults (render sequences and dialogue follow from \`atomic_shots\`, as on
 * the cloud); a cloud project posts to Mago cloud as on the web.
 */
export const postProjectScript = async ({
  projectId,
  script,
  maxShots,
  isAtomicShotsRequested,
  isCharacterDesignVersionsRequested,
  isSeparateStyleRequested,
  isSeparateCameraRequested,
  targetDurationS
}: CastProjectScriptRequest): Promise<ScriptCastCreated> => {
  if (await isLocalScriptProject(projectId)) {
    return ScriptCastCreatedSchema.parse(
      await getLocalDesktopApi().scriptProjects.cast({
        projectId,
        script,
        maxShots,
        isAtomicShotsRequested,
        isCharacterDesignVersionsRequested,
        isSeparateStyleRequested,
        isSeparateCameraRequested,
        targetDurationS
      })
    );
  }
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
