"use client";

import { Text } from "@components/Text";
import { Link as AriaLink } from "react-aria-components/Link";
interface Props {
  title: string;
  image: React.ReactNode;
  actionTitle: string;
  path: string;
  onClick?: () => void;
}

export const TutoCard: React.FC<Props> = ({
  title,
  image,
  actionTitle,
  path,
  onClick
}) => (
  <div className="relative w-full text-glyph-primary backdrop-blur-xl rounded-3xl bg-surface-bg-100">
    <div className="relative w-full p-8 pb-5">
      <div className="flex flex-col gap-4 min-h-fit">
        <Text
          color="glyph-primary"
          component="h3"
          lineHeight="snug"
          select="none"
          variant="lg"
        >
          {title}
        </Text>

        <div className="h-20 flex">{image}</div>

        <div className="w-full">
          <AriaLink
            href={path}
            target="_blank"
            className="text-glyph-primary-on-pic underline underline-offset-4"
            onPress={onClick}
          >
            {actionTitle}
          </AriaLink>
        </div>
      </div>
    </div>
  </div>
);
