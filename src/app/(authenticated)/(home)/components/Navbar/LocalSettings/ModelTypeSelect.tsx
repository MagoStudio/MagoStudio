import { Icon } from "@components/Icon";
import { useModalPortalContainer } from "@components/Modal/ModalPortalContext";
import { Button } from "react-aria-components/Button";
import { ListBox, ListBoxItem } from "react-aria-components/ListBox";
import { Popover } from "react-aria-components/Popover";
import { Select, SelectValue } from "react-aria-components/Select";
import { useTranslation } from "react-i18next";

import { LOCAL_MODEL_DEFINITIONS } from "../../../../../../../desktop/shared/localModelDefinitions";
import type {
  LocalModelType,
  ModelSettingsSnapshot
} from "../../../../../../../desktop/shared/modelSettings";

import { modelSetupStatus } from "./modelSetupStatus";
import { SettingsStatusMark } from "./SettingsStatusMark";

export const ModelTypeSelect = ({
  value,
  onChange,
  disabled,
  snapshots
}: {
  value: LocalModelType;
  onChange: (value: LocalModelType) => void;
  disabled: boolean;
  snapshots: (ModelSettingsSnapshot | undefined)[];
}) => {
  const { t } = useTranslation();
  const portalContainer = useModalPortalContainer();
  // React Aria caches collection rows by item identity. Include live status in
  // the items instead of closing over snapshots with static definitions.
  const items = LOCAL_MODEL_DEFINITIONS.map((definition) => ({
    ...definition,
    ready: modelSetupStatus(
      snapshots.find((item) => item?.model === definition.id)
    )
  }));
  const label = (id: LocalModelType) => {
    const definition = items.find((item) => item.id === id)!;
    const ready = definition.ready;
    return (
      <span className="flex items-center gap-2">
        {ready !== null && (
          <SettingsStatusMark ready={ready} label={definition.label} />
        )}
        <span>{definition.label}</span>
      </span>
    );
  };
  return (
    <Select
      aria-label={t("modelSettings.modelType")}
      selectedKey={value}
      onSelectionChange={(key) => onChange(key as LocalModelType)}
      isDisabled={disabled}
    >
      <Button className="flex w-full items-center justify-between rounded bg-element-primary px-3 py-2 text-glyph-primary disabled:opacity-50">
        <SelectValue>{() => label(value)}</SelectValue>
        <Icon iconSet="16" iconName="chevron-down" />
      </Button>
      <Popover
        UNSTABLE_portalContainer={portalContainer}
        style={{ width: "var(--trigger-width)" }}
      >
        <ListBox
          className="rounded bg-element-tertiary p-1 text-glyph-primary"
          items={items}
        >
          {(definition) => (
            <ListBoxItem
              id={definition.id}
              textValue={definition.label}
              className="cursor-pointer rounded px-3 py-2 outline-hidden data-focused:not-data-selected:bg-glyph-primary/5 data-selected:bg-element-primary"
            >
              {label(definition.id)}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </Select>
  );
};
