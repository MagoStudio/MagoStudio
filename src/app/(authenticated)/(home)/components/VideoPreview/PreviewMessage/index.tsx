import { CircularProgress } from "@components/CircularProgress";
import { Text } from "@components/Text";
import { PreviewContainer } from "@home/components/VideoPreview/PreviewContainer";

type Props = {
  message?: string;
  variant?: "status" | "text" | "loading" | "rendering";
} & React.HTMLAttributes<HTMLDivElement>;

export const PreviewMessage: React.FC<Props> = ({
  message,
  variant = "status",
  ...props
}) => {
  if (variant === "text") {
    return (
      <PreviewContainer>
        <div className={"flex flex-col items-center justify-center gap-2.5"}>
          <Text
            align="center"
            color="glyph-action-main"
            className="max-w-[42ch]"
            variant="sm"
          >
            {message}
          </Text>
        </div>
      </PreviewContainer>
    );
  }

  if (variant === "rendering") {
    return (
      <PreviewContainer>
        <div
          className="flex flex-col items-center justify-center gap-3"
          aria-label={message}
          {...props}
        >
          <img
            alt="Rendering flower"
            className="h-16 w-16 select-none"
            src="/flower.gif"
          />
          {message ? (
            <Text
              align="center"
              className="animate-pulse-opacity"
              color="glyph-primary-on-pic"
              variant="md"
            >
              {message}
            </Text>
          ) : null}
        </div>
      </PreviewContainer>
    );
  }

  const isLoading = variant === "loading";

  return (
    <PreviewContainer>
      <div
        className={`py-3 w-fit rounded-lg bg-glyph-action-main-opacity-20 backdrop-blur-xl shadow-glassmorphism ${
          isLoading ? "px-3" : "px-4"
        }`}
        aria-label={message}
        {...props}
      >
        {isLoading ? (
          <CircularProgress
            color="glyph-primary-on-pic"
            size="sm"
            aria-label={"Status loading"}
          />
        ) : (
          <Text
            align="center"
            className="animate-pulse-opacity"
            color="glyph-primary-on-pic"
            variant="md"
          >
            {message}
          </Text>
        )}
      </div>
    </PreviewContainer>
  );
};
