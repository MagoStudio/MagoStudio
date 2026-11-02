import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useProject } from "@domains/project/useProject";
import { useTextModelRoute } from "@domains/prompt/useTextModelRoute";
import { DEFAULT_SCRIPT_MAX_SHOTS } from "@domains/scriptProject/constants";
import { useAgentScriptDraft } from "@domains/scriptProject/useAgentScriptDraft";
import { useCastProjectScript } from "@domains/scriptProject/useCastProjectScript";
import { useProjectOutputSize } from "@domains/scriptProject/useProjectOutputSize";
import { useProjectScriptVersions } from "@domains/scriptProject/useProjectScriptVersions";
import { useScriptChat } from "@domains/scriptProject/useScriptChat";
import { useScriptTextAccess } from "@domains/scriptProject/useScriptTextAccess";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ProjectOutputSizeControls } from "./ProjectOutputSizeControls";
import { ScriptAgentSignInDialog } from "./ScriptAgentSignInDialog";
import { ScriptBox } from "./ScriptBox";
import { ScriptChat } from "./ScriptChat";
import { ScriptIdeaCard } from "./ScriptIdeaCard";

const SCRIPT_IDEA_LABEL_KEYS = [
  "script_project.script_idea_blood_cells.label",
  "script_project.script_idea_everyday_object.label",
  "script_project.script_idea_tiny_astronaut.label"
];

type Props = {
  projectId: string;
  isRunActive: boolean;
  isScriptSent: boolean;
  onRunStarted: (planId: string) => void;
};

export const ScriptTab: React.FC<Props> = ({
  projectId,
  isRunActive,
  isScriptSent,
  onRunStarted
}) => {
  const { t } = useTranslation();
  const textModel = useTextModelRoute();
  const [chatDraft, setChatDraft] = useState("");
  const textAccess = useScriptTextAccess();
  const { data: project } = useProject(projectId);
  const isLocalProject = project?.origin === "local";

  const {
    agentScriptDraft,
    agentScriptDocument,
    isScriptBoxOpen,
    setAgentScriptDraft,
    saveAgentScriptDraft,
    applyAgentScript
  } = useAgentScriptDraft(projectId);

  const extractedTarget = agentScriptDocument?.target_duration_sec;
  const targetDurationS =
    typeof extractedTarget === "number" && extractedTarget > 0
      ? extractedTarget
      : undefined;

  const { messages, isWaitingForReply, sendMessage } = useScriptChat({
    projectId,
    beforeSend: textAccess.ensureAccess,
    scriptBoxText: agentScriptDraft,
    onScriptWritten: applyAgentScript,
    onRefusal: setChatDraft,
    onFailedMessageResent: (resentUserText) =>
      setChatDraft((currentDraft) =>
        currentDraft === resentUserText ? "" : currentDraft
      )
  });

  const { outputSize, setOutputSize, isSavingOutputSize } =
    useProjectOutputSize(projectId);

  const { mutate: castScript, isPending: isCastingScript } =
    useCastProjectScript(textAccess.ensureAccess);

  const { data: scriptVersions } = useProjectScriptVersions(projectId);
  const latestCastSummary = scriptVersions?.versions.at(-1)?.summary;

  const isCastingInFlight = isCastingScript || isRunActive;
  /** Once sent, a script stays locked for good — casting settling never unlocks it again.
   * This is the one value every control on the tab reads. */
  const isScriptLockedAfterSending = isScriptSent || isCastingInFlight;
  const canRunPipeline =
    agentScriptDraft.trim().length > 0 && !isScriptLockedAfterSending;

  return (
    <div className="grid h-full min-h-0 grid-cols-[360px_minmax(0,1fr)] gap-6 overflow-hidden p-6">
      <ScriptChat
        routeLabel={isLocalProject ? textModel.routeLabel : undefined}
        messages={messages}
        draft={chatDraft}
        isWaitingForReply={isWaitingForReply || textAccess.isChecking}
        isScriptLockedAfterSending={isScriptLockedAfterSending}
        onDraftChange={setChatDraft}
        onSubmit={async () => {
          const wasSent = await sendMessage(
            chatDraft,
            isScriptBoxOpen ? agentScriptDraft : undefined
          );
          if (wasSent)
            setChatDraft((current) => (current === chatDraft ? "" : current));
        }}
      />

      <ScriptAgentSignInDialog
        isOpen={textAccess.isOpen}
        isSignedIn={textAccess.isSignedIn}
        isCloudPending={textAccess.isCloudPending}
        cloudError={textAccess.cloudError}
        canSetUpLocally={textAccess.canSetUpLocally}
        onCancel={textAccess.close}
        onUseCloud={() => void textAccess.enableCloud()}
      />

      {isScriptBoxOpen ? (
        <div className="flex h-full min-h-0 justify-center">
          <div className="grid h-full min-h-0 w-full max-w-[734px] grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
            <Text variant="sm" color="glyph-secondary">
              {t("script_project.script_input.label")}
            </Text>
            <ScriptBox
              data-testid="script-project-agent-script"
              className="h-full"
              value={agentScriptDraft}
              placeholder={t("script_project.script_input.placeholder")}
              readOnly={isScriptLockedAfterSending}
              onChange={(event) => setAgentScriptDraft(event.target.value)}
              onBlur={saveAgentScriptDraft}
            />
            <div className="flex flex-wrap items-end gap-3">
              <MainButton
                colorScheme="primary"
                isDisabled={!canRunPipeline || textAccess.isChecking}
                loading={isCastingInFlight || textAccess.isChecking}
                data-testid="script-project-generate-from-script"
                onPress={async () => {
                  if (!(await textAccess.ensureAccess())) return;
                  castScript(
                    {
                      projectId,
                      script: agentScriptDraft,
                      maxShots: DEFAULT_SCRIPT_MAX_SHOTS,
                      isAtomicShotsRequested: true,
                      targetDurationS
                    },
                    { onSuccess: (created) => onRunStarted(created.plan_id) }
                  );
                }}
              >
                {t("script_project.generate_from_script_button.label")}{" "}
                {isLocalProject ? textModel.routeLabel : undefined}
              </MainButton>
              <div className="ml-auto flex flex-wrap items-end gap-3">
                <ProjectOutputSizeControls
                  isResolutionHidden
                  outputSize={outputSize}
                  isDisabled={isSavingOutputSize || isScriptLockedAfterSending}
                  onChange={setOutputSize}
                />
              </div>
            </div>
            {latestCastSummary?.length_warning ? (
              <Text
                variant="sm"
                color="glyph-warning"
                data-testid="script-project-length-warning"
              >
                ⚠ {latestCastSummary.length_warning}
              </Text>
            ) : latestCastSummary?.planned_total_s != null ? (
              <Text variant="sm" color="glyph-secondary">
                {latestCastSummary.target_duration_s != null
                  ? t("script_project.planned_length_with_target.label", {
                      planned: latestCastSummary.planned_total_s,
                      target: latestCastSummary.target_duration_s
                    })
                  : t("script_project.planned_length.label", {
                      planned: latestCastSummary.planned_total_s
                    })}
              </Text>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col items-center justify-center gap-6 p-6">
          <Text
            variant="sm"
            color="glyph-secondary"
            className="max-w-100 text-center"
          >
            {t("script_project.script_agent_intro.label")}
          </Text>

          <MainButton
            colorScheme="primary"
            isDisabled={isWaitingForReply || isScriptLockedAfterSending}
            data-testid="script-project-own-script"
            onPress={() => setAgentScriptDraft("")}
          >
            {t("script_project.own_script_button.label")}
          </MainButton>

          <div className="flex w-full max-w-100 flex-col gap-2">
            <Text variant="xs" color="glyph-tertiary">
              {t("script_project.script_ideas_title.label")}
            </Text>
            {SCRIPT_IDEA_LABEL_KEYS.map((ideaLabelKey) => (
              <ScriptIdeaCard
                key={ideaLabelKey}
                idea={t(ideaLabelKey)}
                isDisabled={
                  isWaitingForReply ||
                  textAccess.isChecking ||
                  isScriptLockedAfterSending
                }
                onPress={() => sendMessage(t(ideaLabelKey))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
