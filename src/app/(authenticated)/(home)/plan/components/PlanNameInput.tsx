import { Input } from "@components/Input";
import { Text } from "@components/Text";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

export const PlanNameInput: React.FC = () => {
  const { t } = useTranslation();
  const {
    register,
    formState: { errors }
  } = useFormContext<{ name?: string }>();

  return (
    <div className="flex flex-col gap-1">
      <Input
        {...register("name")}
        placeholder={t("plan.name_placeholder.label")}
        severity={errors.name ? "error" : undefined}
      />
      {errors.name && (
        <Text variant="2xs" color="glyph-error">
          {errors.name.message}
        </Text>
      )}
    </div>
  );
};
