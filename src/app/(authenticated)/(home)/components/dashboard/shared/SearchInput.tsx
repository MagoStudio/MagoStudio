import { Icon } from "@components/Icon";
import React from "react";
import { Button } from "react-aria-components/Button";
import { Input } from "react-aria-components/Input";
import { SearchField } from "react-aria-components/SearchField";
import { Text } from "react-aria-components/Text";
import { useTranslation } from "react-i18next";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onFocusChange?: (isFocused: boolean) => void;
};

export const SearchInput: React.FC<Props> = ({
  value,
  onChange,
  onFocusChange
}) => {
  const { t } = useTranslation();

  const onClosePress = () => {
    onChange("");
  };

  return (
    <SearchField
      type="text"
      className="group flex items-center gap-2 w-full"
      aria-label="Search"
      data-testid="project-search-bar"
      value={value}
      onChange={onChange}
    >
      <Icon
        iconSet="24"
        iconName="search"
        className="text-glyph-tertiary group-hover:text-glyph-secondary group-focus-within:text-glyph-primary transition-colors"
      />
      <Input
        className="bg-transparent flex-1 focus:outline-hidden text-sm text-glyph-primary placeholder:text-glyph-tertiary group-hover:placeholder:text-glyph-secondary group-focus-within:placeholder:text-glyph-primary transition-colors"
        placeholder={t("actions.search_projects.placeholder")}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
      />
      {value !== "" && (
        <Button
          onPress={onClosePress}
          className="text-glyph-tertiary hover:text-glyph-primary transition-colors"
        >
          <Icon iconSet="16" iconName="cross" />
        </Button>
      )}
      <Text slot="description" />
    </SearchField>
  );
};
