import { useLongFormRunIdFromUrl } from "@domains/longFormRun/useLongFormRunIdFromUrl";
import { useLongFormRunView } from "@domains/longFormRun/useLongFormRunView";
import { useSubmitLongFormScript } from "@domains/longFormRun/useSubmitLongFormScript";
import { LongFormRunPhase } from "@home/long-form/[accessKey]/components/LongFormRunPhase";
import { LongFormScriptInput } from "@home/long-form/[accessKey]/components/LongFormScriptInput";
import { LongFormShotList } from "@home/long-form/[accessKey]/components/LongFormShotList";

export const LongFormRunScreen = () => {
  const runId = useLongFormRunIdFromUrl();
  const {
    submitScript,
    isSubmittingLongFormScript,
    didLongFormScriptSubmissionFail
  } = useSubmitLongFormScript();
  const runView = useLongFormRunView(runId);

  return (
    <div
      data-testid="long-form-page"
      className="relative isolate flex h-full w-full min-w-0 flex-col overflow-hidden"
    >
      <div className="flex h-full min-h-0 w-full flex-col">
        <div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 min-w-80 flex-1 flex-col">
            <LongFormShotList
              hasShotsChildSpawned={runView.hasShotsChildSpawned}
              isLoading={runView.isLoading}
              isRunActive={runView.isRunActive}
              status={runView.status}
              shots={runView.shots}
              projectName={runView.projectName}
            />
          </div>
          <div className="w-90 flex min-h-0 flex-shrink-0 flex-col border-l border-glyph-invert-main shadow-modal">
            <div className="flex min-h-0 flex-1 flex-col gap-4 bg-surface-secondary p-3">
              <LongFormScriptInput
                runId={runId}
                runStatus={runView.status}
                isSubmitting={isSubmittingLongFormScript}
                didSubmissionFail={didLongFormScriptSubmissionFail}
                onSubmit={submitScript}
              />
              <LongFormRunPhase status={runView.status} phase={runView.phase} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
