import { z } from "zod";

import {
  AgentScriptDocumentSchema,
  ProjectTypeSchema,
  ScriptChatTurnSchema
} from "@/schemas/scriptProject";
import { ShotSchema } from "@/schemas/shot";

const LOCAL_H3_FAST_STEPS = 3;
const LOCAL_H3_BASELINE_STEPS = 4;
const LOCAL_H3_QUALITY_STEPS = 8;

const FolderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentFolderId: z.string(),
  createdAt: z.coerce.number(),
  type: z.literal("folder")
});

const ProjectItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentFolderId: z.string(),
  createdAt: z.coerce.number(),
  type: z.literal("project")
});

const FolderSchema = z.discriminatedUnion("type", [
  FolderItemSchema,
  ProjectItemSchema
]);

const ShotFolderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentFolderId: z.string(),
  createdAt: z.coerce.number(),
  type: z.literal("folder")
});

const ShotRefItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentFolderId: z.string(),
  createdAt: z.coerce.number(),
  type: z.literal("shot")
});

const ShotFolderSchema = z.discriminatedUnion("type", [
  ShotFolderItemSchema,
  ShotRefItemSchema
]);

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  active: z.coerce.boolean(),
  type: ProjectTypeSchema.default("timeline"),
  origin: z.enum(["local", "cloud"]).optional(),
  shared_group_id: z.string().nullable().optional(),
  settings: z.object({
    rangeMin: z.coerce.number().optional(),
    rangeMax: z.coerce.number().optional(),
    folders: z.array(FolderSchema).optional(),
    shotFolders: z.array(ShotFolderSchema).optional(),
    pinnedTrackIds: z.record(z.string(), z.string()).optional(),
    betaI2vShotId: z.string().optional(),
    output_size: z.array(z.number()).optional(),
    shot_frames: z.number().optional(),
    shot_quality_retries: z.number().optional(),
    local_h3_steps: z
      .union([
        z.literal(LOCAL_H3_FAST_STEPS),
        z.literal(LOCAL_H3_BASELINE_STEPS),
        z.literal(LOCAL_H3_QUALITY_STEPS)
      ])
      .optional(),
    local_h3_legacy_workflow: z.boolean().optional(),
    local_h3_text_encoder: z.enum(["heretic", "vanilla"]).optional(),
    // Keep projects written by builds with newer H3 workflows readable. The
    // active build still filters its selectable/renderable models separately.
    local_h3_model: z.string().optional(),
    sheet_aspect_ratio: z.string().optional(),
    sheet_resolution: z.string().optional(),
    sheet_render_model: z.string().optional(),
    storyboard_render_model: z.string().optional(),
    shot_engine: z.string().optional(),
    visual_style: z.string().nullable().optional(),
    agent_script: z.string().optional(),
    agent_script_document: AgentScriptDocumentSchema.nullable()
      .optional()
      .catch(null),
    agent_chat: z.array(ScriptChatTurnSchema).optional().catch([])
  }),
  timelines: z.array(ShotSchema).optional()
});

export type ProjectItem = z.infer<typeof ProjectItemSchema>;

export type Project = z.infer<typeof ProjectSchema>;
