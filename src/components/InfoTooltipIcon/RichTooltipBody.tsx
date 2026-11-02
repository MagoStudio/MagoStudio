import { Text } from "@components/Text";
import { TooltipImage } from "@models/shared/types";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

type Props = {
  markdown?: string;
  images?: TooltipImage[];
};

const Heading: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <Text
    component="h4"
    variant="md"
    weight="bold"
    color="glyph-primary-on-pic"
    className="mb-1"
  >
    {children}
  </Text>
);

const markdownComponents = {
  h1: Heading,
  h2: Heading,
  h3: Heading,
  h4: Heading,
  p: ({ children }: { children?: React.ReactNode }) => (
    <Text
      component="p"
      variant="sm"
      color="glyph-primary-on-pic"
      className="mb-2 last:mb-0"
    >
      {children}
    </Text>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <Text component="span" variant="sm" weight="bold" color="inherit">
      {children}
    </Text>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <Text component="span" variant="sm" color="inherit" className="italic">
      {children}
    </Text>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a
      className="text-glyph-action-main underline underline-offset-2"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-black/30 px-1 py-0.5 text-xs">{children}</code>
  )
};

const remarkPlugins = [remarkBreaks];

export const RichTooltipBody: React.FC<Props> = ({ markdown, images }) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {images && images.length > 0 && (
        <div className="flex gap-2">
          {images.map(({ src, caption }) => (
            <div key={src} className="flex flex-col gap-1 flex-1 min-w-0">
              <img
                className="rounded w-full h-auto object-cover"
                alt=""
                src={src}
              />
              <Text
                component="span"
                variant="sm"
                color="glyph-primary-on-pic"
                className="truncate"
              >
                {caption}
              </Text>
            </div>
          ))}
        </div>
      )}
      {markdown && (
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          components={markdownComponents}
        >
          {markdown}
        </ReactMarkdown>
      )}
    </div>
  );
};
