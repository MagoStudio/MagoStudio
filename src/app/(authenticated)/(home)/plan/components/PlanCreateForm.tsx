import { Checkbox } from "@components/Checkbox";
import { Form } from "@components/Form/Form";
import { GhostButton } from "@components/GhostButton";
import { Input } from "@components/Input";
import { Text } from "@components/Text";
import { useCreatePlan } from "@domains/plan/useCreatePlan";
import { usePlanShotImageAssignments } from "@domains/plan/usePlanShotImageAssignments";
import {
  getImg2ImgCost,
  PLAN_IMG2IMG_NANOBANANA_PRO_COST
} from "@domains/plan/utils/getImg2ImgCost";
import { getSelectedShotImageAssignments } from "@domains/plan/utils/getSelectedShotImageAssignments";
import { getShotDimensions } from "@domains/plan/utils/getShotDimensions";
import { getShotFrameCount } from "@domains/plan/utils/getShotFrameCount";
import {
  mapImg2ImgSettingsToFormValues,
  mapImg2ImgToPlanSettings,
  mapSequentialShotSettings,
  mapVideoToPlanSettings
} from "@domains/plan/utils/mapPlanSettings";
import { sumPlanCost } from "@domains/plan/utils/sumPlanCost";
import { useProject } from "@domains/project/useProject";
import { getFrameRangeLength } from "@domains/renders/utils/getFrameRangeLength";
import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { useMountEffect } from "@hooks/useMountEffect";
import {
  QUALITY_RETRY_UNSUPPORTED_ENGINES,
  VIDEO_ONLY_ENGINES
} from "@models/video/constants";
import {
  VideoEngine,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import {
  CreatePlanRequest,
  MAX_QUALITY_RETRIES_CAP,
  Plan
} from "@schemas/plan";
import { useToast } from "@store/useToast";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { PlanCreateSubmitButton } from "./PlanCreateSubmitButton";
import {
  PlanImg2ImgSection,
  PlanImg2ImgSectionHandle
} from "./PlanImg2ImgSection";
import { PlanNameInput } from "./PlanNameInput";
import { PlanShotImagesSection } from "./PlanShotImagesSection";
import { PlanVideoSection, PlanVideoSectionHandle } from "./PlanVideoSection";
import { PlanShotPickerField } from "./shotPicker/PlanShotPickerField";

interface PlanCreateFormProps {
  projectId: string;
  onCreated: () => void;
  onCancel: () => void;
  initialSettings?: Plan["input_data"];
  initialShotImageAssetIdByTimelineId?: Record<string, string>;
}

const PLAN_NAME_MAX_LENGTH = 200;
const DEFAULT_FRAME_RANGE_END = 48;
const DEFAULT_QUALITY_RETRIES = 2;
const DEFAULT_KEYFRAME_CANDIDATES = 5;
const DEFAULT_KEYFRAME_SELECT = 1;

const clampKeyframeCount = (raw: string) => Math.max(1, parseInt(raw, 10) || 1);

const FULL_SHOT_FRAME_RANGE: [number, number] = [0, -1];

const isFullShotRange = (range: [number, number] | undefined): boolean =>
  range?.[0] === FULL_SHOT_FRAME_RANGE[0] &&
  range?.[1] === FULL_SHOT_FRAME_RANGE[1];

const clampQualityRetries = (raw: string) =>
  Math.min(MAX_QUALITY_RETRIES_CAP, Math.max(0, parseInt(raw, 10) || 0));

const PlanFormSchema = z.object({
  timeline_ids: z.array(z.string()).min(1),
  name: z.string().max(PLAN_NAME_MAX_LENGTH).optional()
});

type PlanFormValues = z.infer<typeof PlanFormSchema>;

export const PlanCreateForm: React.FC<PlanCreateFormProps> = ({
  projectId,
  onCreated,
  onCancel,
  initialSettings,
  initialShotImageAssetIdByTimelineId
}) => {
  const { t } = useTranslation();
  const { mutateAsync } = useCreatePlan();
  const { showToast, showHintToast } = useToast();
  const { data: shots } = useProject(projectId, (p) => p.timelines ?? []);
  const {
    uploads: shotImageUploads,
    manualOverrides: shotImageManualOverrides,
    uploadFiles: uploadShotImages,
    removeUpload: removeShotImageUpload,
    setManualOverride: setShotImageManualOverride
  } = usePlanShotImageAssignments({
    initialManualOverrides: initialShotImageAssetIdByTimelineId
  });

  const img2imgRef = useRef<PlanImg2ImgSectionHandle>(null);
  const videoRef = useRef<PlanVideoSectionHandle>(null);
  const initialFrameRange = initialSettings?.video_settings?.frame_range as
    | [number, number]
    | undefined;
  const initialIsFullShot = isFullShotRange(initialFrameRange);
  const [frameStart, setFrameStart] = useState(
    !initialIsFullShot ? (initialFrameRange?.[0] ?? 0) : 0
  );
  const [frameEnd, setFrameEnd] = useState(
    !initialIsFullShot
      ? (initialFrameRange?.[1] ?? DEFAULT_FRAME_RANGE_END)
      : DEFAULT_FRAME_RANGE_END
  );
  const [img2imgCost, setImg2imgCost] = useState(
    PLAN_IMG2IMG_NANOBANANA_PRO_COST
  );
  const [videoEstimate, setVideoEstimate] = useState<{
    values: VideoSettings;
    model: VideoModelDefinition;
  } | null>(null);

  const [includeVideo, setIncludeVideo] = useState(
    initialSettings !== undefined ? !!initialSettings.video_settings : true
  );
  const [renderFullShots, setRenderFullShots] = useState(initialIsFullShot);
  const [skipImg2ImgPolling, setSkipImg2ImgPolling] = useState(
    !!initialSettings?.img2img_settings?.skip_polling &&
      !initialSettings?.video_settings
  );
  const [skipVideoPolling, setSkipVideoPolling] = useState(
    !!initialSettings?.video_settings?.skip_polling
  );
  const [skipMetrics, setSkipMetrics] = useState(
    !!initialSettings?.img2img_settings?.skip_metrics
  );
  const [useAdaptPrompt, setUseAdaptPrompt] = useState(
    !!initialSettings?.img2img_settings?.use_adapt_prompt
  );
  const [sequentialShots, setSequentialShots] = useState(
    !!initialSettings?.sequential_shots
  );
  const [labelStyleRefs, setLabelStyleRefs] = useState(
    !!initialSettings?.label_style_refs
  );
  const [labelCrossShotRefs, setLabelCrossShotRefs] = useState(
    !!initialSettings?.label_cross_shot_refs
  );
  const [crossShotPromptSuffix, setCrossShotPromptSuffix] = useState<
    string | null
  >(initialSettings?.cross_shot_prompt_suffix ?? null);
  const [crossShotMetrics, setCrossShotMetrics] = useState(
    !!initialSettings?.cross_shot_metrics
  );
  const [keyframeCandidates, setKeyframeCandidates] = useState(
    initialSettings?.keyframe_num_candidates ?? DEFAULT_KEYFRAME_CANDIDATES
  );
  const [keyframeSelect, setKeyframeSelect] = useState(
    initialSettings?.keyframe_num_select ?? DEFAULT_KEYFRAME_SELECT
  );
  const [img2imgRetries, setImg2imgRetries] = useState(
    initialSettings?.img2img_settings?.max_quality_retries ??
      DEFAULT_QUALITY_RETRIES
  );
  const [videoRetries, setVideoRetries] = useState(
    initialSettings?.video_settings?.max_quality_retries ??
      DEFAULT_QUALITY_RETRIES
  );
  const img2imgRestoreResult = initialSettings?.img2img_settings
    ? mapImg2ImgSettingsToFormValues(initialSettings.img2img_settings)
    : undefined;
  const initialImg2ImgValues = img2imgRestoreResult?.values;

  useMountEffect(() => {
    if (initialSettings?.img2img_settings && !img2imgRestoreResult) {
      showHintToast(t("plan.reuse_img2img_failed.label"));
    } else if (img2imgRestoreResult?.usedFallbackModel) {
      showHintToast(t("plan.reuse_img2img_model_changed.label"));
    }
  });

  const getShotImageAssignments = (timelineIds: string[]) =>
    getSelectedShotImageAssignments({
      shots: shots ?? [],
      timelineIds,
      uploads: shotImageUploads,
      manualOverrides: shotImageManualOverrides
    }).assignments;

  const estimateVideoCost = (
    frameCount: number,
    dimensions?: { width: number | undefined; height: number | undefined }
  ) => {
    if (!videoEstimate) return 0;
    const values =
      dimensions?.width !== undefined && dimensions?.height !== undefined
        ? {
            ...videoEstimate.values,
            width: dimensions.width,
            height: dimensions.height
          }
        : videoEstimate.values;
    return videoEstimate.model.calcEstimatedRenderTime(
      values,
      Math.max(0, frameCount)
    ).impactToShow;
  };

  const selectedVideoEngine = includeVideo
    ? videoEstimate?.model.name
    : undefined;
  const isVideoOnlyEngine =
    !!selectedVideoEngine && VIDEO_ONLY_ENGINES.has(selectedVideoEngine);
  const retriesUnsupported =
    !!selectedVideoEngine &&
    QUALITY_RETRY_UNSUPPORTED_ENGINES.has(selectedVideoEngine);

  const useFullShots = includeVideo && renderFullShots;
  const sequentialEnabled =
    includeVideo && sequentialShots && !isVideoOnlyEngine;
  const representativeDimensions = shots?.[0]
    ? getShotDimensions(shots[0])
    : undefined;
  const sharedFrameRange: [number, number] =
    frameStart <= frameEnd ? [frameStart, frameEnd] : [frameEnd, frameStart];
  const sharedVideoCost = includeVideo
    ? estimateVideoCost(
        getFrameRangeLength(sharedFrameRange),
        representativeDimensions
      )
    : 0;
  const fullShotVideoCostById: Record<string, number> = useFullShots
    ? Object.fromEntries(
        (shots ?? []).flatMap((shot) => {
          const frameCount = getShotFrameCount(shot);
          return frameCount === undefined
            ? []
            : [
                [
                  shot.id,
                  estimateVideoCost(frameCount, getShotDimensions(shot))
                ] as const
              ];
        })
      )
    : {};

  const handleImg2ImgChange = (values: Img2ImgType) => {
    setImg2imgCost(getImg2ImgCost(values));
  };

  const handleVideoChange = (
    values: VideoSettings,
    model: VideoModelDefinition
  ) => {
    setVideoEstimate((prev) =>
      prev?.values === values && prev?.model === model
        ? prev
        : { values, model }
    );
  };

  const handleIncludeVideoToggle = () => {
    setIncludeVideo((prev) => {
      const next = !prev;
      if (next) setSkipImg2ImgPolling(false);
      return next;
    });
  };

  const handleSkipImg2ImgPollingToggle = () => {
    if (includeVideo) return;
    setSkipImg2ImgPolling((prev) => !prev);
  };

  const handleFrameStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrameStart(Math.max(0, parseInt(e.target.value, 10) || 0));
  };

  const handleFrameEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrameEnd(Math.max(0, parseInt(e.target.value, 10) || 0));
  };

  const executePlan = async (
    data: PlanFormValues,
    shotImageAssignments: ReturnType<typeof getShotImageAssignments>
  ) => {
    if (!isVideoOnlyEngine) {
      if (!img2imgRef.current) return;
      const isImg2ImgValid = await img2imgRef.current.trigger();
      if (!isImg2ImgValid) return;
    }

    const payload: CreatePlanRequest = {
      project_id: projectId,
      timeline_ids: data.timeline_ids,
      ...mapSequentialShotSettings({
        sequentialShots: sequentialEnabled,
        labelStyleRefs: isVideoOnlyEngine ? false : labelStyleRefs,
        labelCrossShotRefs,
        crossShotPromptSuffix,
        crossShotMetrics,
        keyframeNumCandidates: keyframeCandidates,
        keyframeNumSelect: keyframeSelect
      }),
      name: data.name || undefined
    };

    if (!isVideoOnlyEngine && img2imgRef.current) {
      payload.img2img_settings = mapImg2ImgToPlanSettings(
        img2imgRef.current.getValues(),
        {
          skipPolling: skipImg2ImgPolling,
          skipMetrics,
          useAdaptPrompt,
          maxQualityRetries: img2imgRetries
        }
      );
    }

    if (includeVideo && !videoRef.current) return;

    if (includeVideo && videoRef.current) {
      const { values: videoValues, modelName } = videoRef.current.getValues();
      const sortedRange: [number, number] =
        frameStart <= frameEnd
          ? [frameStart, frameEnd]
          : [frameEnd, frameStart];
      const frameRange: [number, number] = renderFullShots
        ? FULL_SHOT_FRAME_RANGE
        : sortedRange;
      payload.video_settings = mapVideoToPlanSettings(
        videoValues,
        modelName,
        frameRange,
        skipVideoPolling,
        retriesUnsupported ? 0 : videoRetries
      );
    }

    const confirmedShotImageAssignments = shotImageAssignments.filter(
      (assignment) =>
        assignment.status === "matched" && assignment.matchedUploadKey
    );
    if (confirmedShotImageAssignments.length > 0) {
      payload.shot_overrides = Object.fromEntries(
        confirmedShotImageAssignments.map((assignment) => [
          assignment.shotId,
          {
            images: [
              {
                asset_id: assignment.matchedUploadKey as string,
                type: "reference_frame" as const
              }
            ]
          }
        ])
      );
    }

    await mutateAsync(payload);
    showHintToast(t("plan.plan_created.label"));
    onCreated();
  };

  const handleSubmit = (data: PlanFormValues) => {
    const liveShotIds = new Set((shots ?? []).map((shot) => shot.id));
    const validTimelineIds = data.timeline_ids.filter((id) =>
      liveShotIds.has(id)
    );
    const validatedData: PlanFormValues = {
      ...data,
      timeline_ids: validTimelineIds
    };
    const timelineCount = validTimelineIds.length;
    const shotImageAssignments = getShotImageAssignments(validTimelineIds);
    const shotIdsSkippingImg2Img = new Set(
      shotImageAssignments
        .filter((assignment) => assignment.status === "matched")
        .map((assignment) => assignment.shotId)
    );
    const totalCost = sumPlanCost({
      selectedIds: validTimelineIds,
      img2imgCostPerShot: isVideoOnlyEngine ? 0 : img2imgCost,
      fullShots: useFullShots,
      sharedVideoCostPerShot: sharedVideoCost,
      fullShotVideoCostById,
      shotIdsSkippingImg2Img
    });

    showToast({
      message: t("plan.confirm_start.label", {
        cost: totalCost,
        count: timelineCount
      }),
      onSubmit: () => executePlan(validatedData, shotImageAssignments),
      onSubmitText: t("plan.confirm_start_yes.label"),
      onCancelText: t("plan.confirm_start_no.label"),
      showTimer: false
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <Text component="h2" variant="xl" weight="bold" color="glyph-primary">
          {t("plan.create.label")}
        </Text>
        <GhostButton onPress={onCancel}>
          {t("plan.back_to_list.label")}
        </GhostButton>
      </div>
      <Form<PlanFormValues>
        formSchema={PlanFormSchema}
        defaultValues={{
          timeline_ids: initialSettings?.timeline_ids ?? [],
          name: ""
        }}
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Text variant="sm" weight="medium" color="glyph-secondary">
                {t("plan.name_placeholder.label")}
              </Text>
              <PlanNameInput />
            </div>
            <div className="flex flex-col gap-2">
              <Text variant="sm" weight="medium" color="glyph-secondary">
                {t("plan.timeline_selection.label")}
              </Text>
              <PlanShotPickerField projectId={projectId} />
            </div>
            <PlanShotImagesSection
              shots={shots ?? []}
              uploads={shotImageUploads}
              manualOverrides={shotImageManualOverrides}
              onUpload={(files) => uploadShotImages(files, projectId)}
              onRemoveUpload={removeShotImageUpload}
              onManualOverrideChange={setShotImageManualOverride}
            />
            {includeVideo && (
              <div className="flex flex-col gap-2">
                <Checkbox
                  isChecked={renderFullShots}
                  onChange={() => setRenderFullShots((prev) => !prev)}
                  label={t("plan.render_full_shots.label")}
                />
                <Text variant="2xs" color="glyph-tertiary">
                  {t("plan.render_full_shots_hint.label")}
                </Text>
                {!renderFullShots && (
                  <>
                    <Text variant="sm" weight="medium" color="glyph-secondary">
                      {t("plan.frame_range.label")}
                    </Text>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder={t("plan.frame_range_start.label")}
                        value={String(frameStart)}
                        onChange={handleFrameStartChange}
                      />
                      <Text variant="sm" color="glyph-tertiary">
                        –
                      </Text>
                      <Input
                        type="number"
                        placeholder={t("plan.frame_range_end.label")}
                        value={String(frameEnd)}
                        onChange={handleFrameEndChange}
                      />
                    </div>
                    {frameStart >= frameEnd && (
                      <Text variant="2xs" color="glyph-error">
                        {t("plan.frame_range_invalid.label")}
                      </Text>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {isVideoOnlyEngine && (
              <Text variant="2xs" color="glyph-tertiary">
                {t("plan.video_only_engine_hint.label")}
              </Text>
            )}
            <div className={isVideoOnlyEngine ? "hidden" : "contents"}>
              <PlanImg2ImgSection
                ref={img2imgRef}
                onValuesChange={handleImg2ImgChange}
                initialValues={initialImg2ImgValues}
              />
              <Checkbox
                isChecked={skipImg2ImgPolling}
                disabled={includeVideo}
                onChange={handleSkipImg2ImgPollingToggle}
                label={t("plan.skip_polling_img2img.label")}
              />
              {includeVideo && (
                <Text variant="2xs" color="glyph-tertiary">
                  {t("plan.skip_polling_disabled_hint.label")}
                </Text>
              )}
              <Checkbox
                isChecked={skipMetrics}
                onChange={() => setSkipMetrics((prev) => !prev)}
                label={t("plan.skip_metrics.label")}
              />
              <Checkbox
                isChecked={useAdaptPrompt}
                onChange={() => setUseAdaptPrompt((prev) => !prev)}
                label={t("plan.use_adapt_prompt.label")}
              />
            </div>
            {!isVideoOnlyEngine && (
              <>
                <Checkbox
                  isChecked={labelStyleRefs}
                  onChange={() => setLabelStyleRefs((prev) => !prev)}
                  label={t("plan.label_style_refs.label")}
                />
                <Checkbox
                  isChecked={sequentialEnabled}
                  disabled={!includeVideo}
                  onChange={() => setSequentialShots((prev) => !prev)}
                  label={t("plan.sequential_shots.label")}
                />
                <Text variant="2xs" color="glyph-tertiary">
                  {includeVideo
                    ? t("plan.sequential_shots_hint.label")
                    : t("plan.sequential_shots_disabled_hint.label")}
                </Text>
                <Checkbox
                  isChecked={sequentialEnabled && labelCrossShotRefs}
                  disabled={!sequentialEnabled}
                  onChange={() => setLabelCrossShotRefs((prev) => !prev)}
                  label={t("plan.label_cross_shot_refs.label")}
                />
                {sequentialEnabled && labelCrossShotRefs && (
                  <div className="flex flex-col gap-2">
                    <Text variant="sm" weight="medium" color="glyph-secondary">
                      {t("plan.cross_shot_prompt_suffix.label")}
                    </Text>
                    <Input
                      placeholder={t(
                        "plan.cross_shot_prompt_suffix_placeholder.label"
                      )}
                      value={crossShotPromptSuffix ?? ""}
                      onChange={(e) =>
                        setCrossShotPromptSuffix(e.target.value || null)
                      }
                    />
                  </div>
                )}
                <Checkbox
                  isChecked={sequentialEnabled && crossShotMetrics}
                  disabled={!sequentialEnabled}
                  onChange={() => setCrossShotMetrics((prev) => !prev)}
                  label={t("plan.cross_shot_metrics.label")}
                />
                {sequentialEnabled && (
                  <>
                    <div className="flex flex-col gap-2">
                      <Text
                        variant="sm"
                        weight="medium"
                        color="glyph-secondary"
                      >
                        {t("plan.keyframe_num_candidates.label")}
                      </Text>
                      <Input
                        type="number"
                        min={1}
                        value={String(keyframeCandidates)}
                        onChange={(e) =>
                          setKeyframeCandidates(
                            clampKeyframeCount(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Text
                        variant="sm"
                        weight="medium"
                        color="glyph-secondary"
                      >
                        {t("plan.keyframe_num_select.label")}
                      </Text>
                      <Input
                        type="number"
                        min={1}
                        value={String(keyframeSelect)}
                        onChange={(e) =>
                          setKeyframeSelect(clampKeyframeCount(e.target.value))
                        }
                      />
                    </div>
                  </>
                )}
              </>
            )}
            {!isVideoOnlyEngine && (
              <div className="flex flex-col gap-2">
                <Text variant="sm" weight="medium" color="glyph-secondary">
                  {t("plan.img2img_quality_retries.label")}
                </Text>
                <Input
                  type="number"
                  min={0}
                  max={MAX_QUALITY_RETRIES_CAP}
                  value={String(img2imgRetries)}
                  onChange={(e) =>
                    setImg2imgRetries(clampQualityRetries(e.target.value))
                  }
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Checkbox
              isChecked={includeVideo}
              onChange={handleIncludeVideoToggle}
              label={t("plan.include_video.label")}
            />
            {includeVideo && (
              <>
                <PlanVideoSection
                  ref={videoRef}
                  onValuesChange={handleVideoChange}
                  initialValues={
                    initialSettings?.video_settings as VideoSettings | undefined
                  }
                  initialModelEngine={
                    initialSettings?.video_settings?.engine as
                      | VideoEngine
                      | undefined
                  }
                />
                <Checkbox
                  isChecked={skipVideoPolling}
                  onChange={() => setSkipVideoPolling((prev) => !prev)}
                  label={t("plan.skip_polling_video.label")}
                />
                {retriesUnsupported ? (
                  <Text variant="2xs" color="glyph-tertiary">
                    {t("plan.video_quality_retries_unsupported_hint.label")}
                  </Text>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Text variant="sm" weight="medium" color="glyph-secondary">
                      {t("plan.video_quality_retries.label")}
                    </Text>
                    <Input
                      type="number"
                      min={0}
                      max={MAX_QUALITY_RETRIES_CAP}
                      value={String(videoRetries)}
                      onChange={(e) =>
                        setVideoRetries(clampQualityRetries(e.target.value))
                      }
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <PlanCreateSubmitButton
          img2imgCostPerShot={isVideoOnlyEngine ? 0 : img2imgCost}
          fullShots={useFullShots}
          sharedVideoCostPerShot={sharedVideoCost}
          fullShotVideoCostById={fullShotVideoCostById}
          shots={shots ?? []}
          uploads={shotImageUploads}
          manualOverrides={shotImageManualOverrides}
          isDisabled={
            includeVideo && !renderFullShots && frameStart >= frameEnd
          }
        />
      </Form>
    </div>
  );
};
