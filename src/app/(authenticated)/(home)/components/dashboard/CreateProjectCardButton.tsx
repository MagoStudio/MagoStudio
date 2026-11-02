import { Text } from "@components/Text";
import { AiRenderIcon } from "@home/components/renderSettingsComponents/StylizeFrameButton/AiRenderIcon";
import { useTranslation } from "react-i18next";

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export const CreateProjectCardButton: React.FC<Props> = (buttonProps) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="appearance-none bg-transparent border-none p-0 m-0 flex w-full flex-col items-center justify-center aspect-square disabled:opacity-50"
      {...buttonProps}
    >
      <div className="relative w-full h-full text-glyph-primary backdrop-blur-xl rounded-3xl bg-surface-bg-100">
        <div className="relative w-full p-4 flex gap-2 justify-center flex-row items-center h-full">
          <div className="h-6 w-6">
            <AiRenderIcon />
          </div>
          <Text
            color="glyph-primary-on-pic"
            lineHeight="snug"
            select="none"
            variant="md"
          >
            {t("actions.create_project.label")}
          </Text>
        </div>
      </div>
    </button>
  );
};
