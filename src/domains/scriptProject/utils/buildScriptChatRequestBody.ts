import { buildScriptChatMessage } from "./buildScriptChatMessage";
import { SCRIPT_AGENT_SYSTEM_INSTRUCTION } from "./scriptAgentSystemInstruction";

export const WRITE_SCRIPT_FUNCTION = "write_script";
export const REPLY_FUNCTION = "reply";

const continuityBibleParameters = {
  type: "object",
  properties: {
    characters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" }
        },
        required: ["name", "description"]
      }
    },
    setting: { type: "string" },
    style: { type: "string" }
  },
  required: ["characters", "setting", "style"]
};

const screenplayElementParameters = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["camera", "action", "dialogue", "transition"],
      description:
        "camera: one camera line that starts a new cut — shot size, then the camera move if any, then lens feel where it matters. action: what is seen and heard, in present tense. dialogue: one spoken speech. transition: a transition such as CUT TO: or FADE OUT."
    },
    text: {
      type: "string",
      description:
        "For camera, the camera line, such as MEDIUM TWO-SHOT, SLOW PUSH IN. For action, the action lines. For dialogue, only the spoken words. For transition, the transition itself."
    },
    character: {
      type: "string",
      description:
        "Dialogue only: the speaker's name, always the same spelling for the same character. Required for dialogue."
    },
    extension: {
      type: "string",
      description:
        "Dialogue only, optional: V.O. for voice-over or narration, O.S. for a speaker heard but not seen. No parentheses."
    },
    parenthetical: {
      type: "string",
      description:
        "Dialogue only, optional: a short delivery note such as quietly. No parentheses."
    }
  },
  required: ["type", "text"]
};

const screenplaySceneParameters = {
  type: "object",
  properties: {
    scene_number: {
      type: "number",
      description: "The scene's position in the script, starting at 1."
    },
    heading: {
      type: "string",
      description:
        "The scene heading, always in English and in capitals: INT. or EXT., the location, a space-hyphen-space, then the time of day. For example INT. KITCHEN - NIGHT."
    },
    elements: {
      type: "array",
      description: "The scene's action, dialogue and transitions, in order.",
      items: screenplayElementParameters
    }
  },
  required: ["scene_number", "heading", "elements"]
};

const functionDeclarations = [
  {
    name: WRITE_SCRIPT_FUNCTION,
    description:
      "Deliver the whole script as an ordered list of screenplay scenes, which replaces the contents of the user's script editor. Always send every scene, never a fragment.",
    parameters: {
      type: "object",
      properties: {
        series_title: { type: "string" },
        episode_title: { type: "string" },
        target_duration_sec: {
          type: "number",
          description:
            "Total length of the whole video in seconds the user asked for. Fill it whenever the user states or implies a length; omit it if they never did."
        },
        aspect_ratio: { type: "string" },
        continuity_bible: continuityBibleParameters,
        screenplay_scenes: {
          type: "array",
          items: screenplaySceneParameters
        },
        caption: { type: "string" },
        hashtags: { type: "array", items: { type: "string" } }
      },
      required: ["screenplay_scenes"]
    }
  },
  {
    name: REPLY_FUNCTION,
    description:
      "Say something to the user that is not a script, such as a clarifying question or an acknowledgement.",
    parameters: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "The answer to show in the chat."
        }
      },
      required: ["message"]
    }
  }
];

export type ScriptChatRequestBody = {
  project_id: string;
  message: string;
  system_prompt: string;
  tools: { function_declarations: unknown[] }[];
};

/** `system_prompt` is sent on every turn, and
 * `history_messages` is omitted so the backend uses its own default. */
export const buildScriptChatRequestBody = ({
  projectId,
  userInput,
  currentScript
}: {
  projectId: string;
  userInput: string;
  currentScript?: string;
}): ScriptChatRequestBody => ({
  project_id: projectId,
  message: buildScriptChatMessage({ userText: userInput, currentScript }),
  system_prompt: SCRIPT_AGENT_SYSTEM_INSTRUCTION,
  tools: [{ function_declarations: functionDeclarations }]
});
