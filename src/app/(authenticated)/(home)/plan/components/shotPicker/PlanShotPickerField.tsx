import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { PlanShotPickerModal } from "./PlanShotPickerModal";

interface Props {
  projectId: string;
}

export const PlanShotPickerField: React.FC<Props> = ({ projectId }) => {
  const { t } = useTranslation();
  const { setValue } = useFormContext();
  const watchedIds = useWatch({ name: "timeline_ids" });
  const selectedIds = (watchedIds as string[]) ?? [];
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (ids: string[]) => {
    setValue("timeline_ids", ids, { shouldValidate: true });
  };

  const triggerLabel =
    selectedIds.length > 0
      ? t("plan.shots_selected.label", { count: selectedIds.length })
      : t("plan.select_shots.label");

  return (
    <>
      <GhostButton
        className="justify-between w-full bg-element-primary text-glyph-secondary"
        onPress={() => setIsOpen(true)}
        endIcon={<Icon iconSet="16" iconName="chevron-down" />}
      >
        {triggerLabel}
      </GhostButton>
      {isOpen && (
        <PlanShotPickerModal
          onClose={() => setIsOpen(false)}
          projectId={projectId}
          selectedIds={selectedIds}
          onChange={handleChange}
        />
      )}
    </>
  );
};
