import {
  CutExportDispatch,
  CutExportDispatchSchema
} from "@schemas/scriptProject";
import { isAxiosError } from "axios";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocalScriptProject } from "../projectOrigin";

export type ExportProjectCutRequest = {
  projectId: string;
  isDryRun: boolean;
};

const CONFLICT_STATUS = 409;

export const postProjectCutExport = async (
  request: ExportProjectCutRequest
): Promise<CutExportDispatch> => {
  if (await isLocalScriptProject(request.projectId)) {
    return CutExportDispatchSchema.parse(
      await getLocalDesktopApi().scriptProjects.exportCut(request)
    );
  }
  try {
    const response = await backendApiClient.post(
      `/projects/${request.projectId}/cut/export`,
      { dry_run: request.isDryRun }
    );
    return CutExportDispatchSchema.parse(response.data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === CONFLICT_STATUS) {
      return CutExportDispatchSchema.parse(error.response.data);
    }
    throw error;
  }
};
