import { CircularProgress } from "@components/CircularProgress";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
};

/** A project preview is optional cached media. Missing files and expired cloud URLs must not
 * surface the browser's broken-image UI on the local-first home screen. */
export const ProjectPreviewImage: React.FC<Props> = ({
  src,
  alt,
  className = "h-full w-full object-cover"
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const { t } = useTranslation();
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  if (src && failedSrc !== src) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={src}
          alt={alt}
          className={className}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoadedSrc(src)}
          onError={() => setFailedSrc(src)}
        />
        {loadedSrc !== src && (
          <div className="absolute inset-0 flex items-center justify-center">
            <CircularProgress
              size="sm"
              aria-label={t("status.loading_project_preview.label")}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      data-testid="project-preview-fallback"
      className={className}
      style={{
        background:
          "linear-gradient(135deg, var(--color-surface-bg-300) 0%, var(--color-element-primary) 52%, var(--color-surface-bg-100) 100%)"
      }}
    />
  );
};
