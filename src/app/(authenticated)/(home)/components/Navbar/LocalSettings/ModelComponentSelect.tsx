import { Icon } from "@components/Icon";
import { useModalPortalContainer } from "@components/Modal/ModalPortalContext";
import { Button } from "react-aria-components/Button";
import { ListBox, ListBoxItem } from "react-aria-components/ListBox";
import { Popover } from "react-aria-components/Popover";
import { Select, SelectValue } from "react-aria-components/Select";
import { useTranslation } from "react-i18next";

import type {
  ModelComponent,
  ModelSettingsSnapshot
} from "../../../../../../../desktop/shared/modelSettings";

import { componentSetupStatus } from "./modelSetupStatus";
import { SettingsStatusMark } from "./SettingsStatusMark";

export const ModelComponentSelect = ({
  value,
  onChange,
  disabled,
  components
}: {
  value: ModelComponent;
  onChange: (value: ModelComponent) => void;
  disabled: boolean;
  components: ModelSettingsSnapshot["components"];
}) => {
  const { t } = useTranslation();
  const portalContainer = useModalPortalContainer();
  const label = (id: ModelComponent) => {
    const component = components.find((item) => item.role === id)!;
    const name = t(`modelSettings.roles.${id}`);
    const ready = componentSetupStatus(component);
    return (
      <span className="flex items-center gap-2">
        {ready !== null && <SettingsStatusMark ready={ready} label={name} />}
        <span>{name}</span>
      </span>
    );
  };
  return (
    <Select
      aria-label={t("modelSettings.component")}
      selectedKey={value}
      onSelectionChange={(key) => onChange(key as ModelComponent)}
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
          items={components}
        >
          {(component) => (
            <ListBoxItem
              id={component.role}
              textValue={t(`modelSettings.roles.${component.role}`)}
              className="cursor-pointer rounded px-3 py-2 outline-hidden data-focused:not-data-selected:bg-glyph-primary/5 data-selected:bg-element-primary"
            >
              {label(component.role)}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </Select>
  );
};
