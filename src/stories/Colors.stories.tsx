import { Text } from "@components/Text";
import { useMountEffect } from "@hooks/useMountEffect";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";

const rgbToHex = (rgb: string): string => {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;
  const [, r, g, b] = match;
  return `#${[r, g, b].map((c) => Number(c).toString(16).padStart(2, "0")).join("")}`;
};

type ColorSwatchProps = {
  cssVar: string;
  figmaToken: string;
  tailwindClass: string;
};

const ColorSwatch = ({
  cssVar,
  figmaToken,
  tailwindClass
}: ColorSwatchProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hex, setHex] = useState("");

  useMountEffect(() => {
    if (!ref.current) return;
    const computed = getComputedStyle(ref.current).backgroundColor;
    setHex(rgbToHex(computed));
  });

  return (
    <div className="flex items-center gap-3">
      <div
        ref={ref}
        className="w-12 h-12 rounded-lg border border-glyph-stroke shrink-0"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div className="flex flex-col gap-0.5 min-w-0">
        <Text
          component="span"
          variant="xs"
          weight="semibold"
          color="glyph-primary"
        >
          {figmaToken}
        </Text>
        <Text component="span" variant="xs" color="glyph-tertiary">
          {tailwindClass}
        </Text>
        {hex && (
          <Text component="span" variant="xs" color="glyph-secondary">
            {hex}
          </Text>
        )}
      </div>
    </div>
  );
};

type SectionProps = {
  title: string;
  colors: ColorSwatchProps[];
};

const Section = ({ title, colors }: SectionProps) => (
  <div className="flex flex-col gap-4">
    <Text component="h2" variant="lg" weight="bold" color="glyph-primary">
      {title}
    </Text>
    <div className="grid grid-cols-4 gap-x-8 gap-y-4">
      {colors.map((color) => (
        <ColorSwatch key={color.cssVar} {...color} />
      ))}
    </div>
  </div>
);

const GLYPH_COLORS: ColorSwatchProps[] = [
  {
    cssVar: "--color-glyph-primary",
    figmaToken: "Glyph / Primary",
    tailwindClass: "text-glyph-primary"
  },
  {
    cssVar: "--color-glyph-secondary",
    figmaToken: "Glyph / Secondary",
    tailwindClass: "text-glyph-secondary"
  },
  {
    cssVar: "--color-glyph-tertiary",
    figmaToken: "Glyph / Tertiary",
    tailwindClass: "text-glyph-tertiary"
  },
  {
    cssVar: "--color-glyph-disabled",
    figmaToken: "Glyph / Disabled",
    tailwindClass: "text-glyph-disabled"
  },
  {
    cssVar: "--color-glyph-action-main",
    figmaToken: "Glyph / Action Main",
    tailwindClass: "text-glyph-action-main"
  },
  {
    cssVar: "--color-glyph-action-secondary",
    figmaToken: "Glyph / Action Secondary",
    tailwindClass: "text-glyph-action-secondary"
  },
  {
    cssVar: "--color-glyph-invert-main",
    figmaToken: "Glyph / Invert Main",
    tailwindClass: "text-glyph-invert-main"
  },
  {
    cssVar: "--color-glyph-primary-on-pic",
    figmaToken: "Glyph / Primary On Pic",
    tailwindClass: "text-glyph-primary-on-pic"
  },
  {
    cssVar: "--color-glyph-stroke",
    figmaToken: "Glyph / Stroke",
    tailwindClass: "text-glyph-stroke"
  },
  {
    cssVar: "--color-glyph-stroke-2",
    figmaToken: "Glyph / Stroke 2",
    tailwindClass: "text-glyph-stroke-2"
  },
  {
    cssVar: "--color-glyph-error",
    figmaToken: "Glyph / Error",
    tailwindClass: "text-glyph-error"
  },
  {
    cssVar: "--color-glyph-error-hover",
    figmaToken: "Glyph / Error Hover",
    tailwindClass: "text-glyph-error-hover"
  },
  {
    cssVar: "--color-glyph-success",
    figmaToken: "Glyph / Success",
    tailwindClass: "text-glyph-success"
  },
  {
    cssVar: "--color-glyph-success-hover",
    figmaToken: "Glyph / Success Hover",
    tailwindClass: "text-glyph-success-hover"
  },
  {
    cssVar: "--color-glyph-warning",
    figmaToken: "Glyph / Warning",
    tailwindClass: "text-glyph-warning"
  },
  {
    cssVar: "--color-glyph-warning-hover",
    figmaToken: "Glyph / Warning Hover",
    tailwindClass: "text-glyph-warning-hover"
  }
];

const ELEMENT_COLORS: ColorSwatchProps[] = [
  {
    cssVar: "--color-element-primary",
    figmaToken: "Element / Primary",
    tailwindClass: "bg-element-primary"
  },
  {
    cssVar: "--color-element-primary-active",
    figmaToken: "Element / Primary Active",
    tailwindClass: "bg-element-primary-active"
  },
  {
    cssVar: "--color-element-primary-on-pic",
    figmaToken: "Element / Primary On Pic",
    tailwindClass: "bg-element-primary-on-pic"
  },
  {
    cssVar: "--color-element-secondary",
    figmaToken: "Element / Secondary",
    tailwindClass: "bg-element-secondary"
  },
  {
    cssVar: "--color-element-secondary-active",
    figmaToken: "Element / Secondary Active",
    tailwindClass: "bg-element-secondary-active"
  },
  {
    cssVar: "--color-element-tertiary",
    figmaToken: "Element / Tertiary",
    tailwindClass: "bg-element-tertiary"
  },
  {
    cssVar: "--color-element-tertiary-active",
    figmaToken: "Element / Tertiary Active",
    tailwindClass: "bg-element-tertiary-active"
  },
  {
    cssVar: "--color-element-additional-active",
    figmaToken: "Element / Additional Active",
    tailwindClass: "bg-element-additional-active"
  },
  {
    cssVar: "--color-element-for-hover",
    figmaToken: "Element / For Hover",
    tailwindClass: "bg-element-for-hover"
  },
  {
    cssVar: "--color-element-on-image",
    figmaToken: "Element / On Image",
    tailwindClass: "bg-element-on-image"
  },
  {
    cssVar: "--color-element-error",
    figmaToken: "Element / Error",
    tailwindClass: "bg-element-error"
  },
  {
    cssVar: "--color-element-success",
    figmaToken: "Element / Success",
    tailwindClass: "bg-element-success"
  },
  {
    cssVar: "--color-element-warning",
    figmaToken: "Element / Warning",
    tailwindClass: "bg-element-warning"
  },
  {
    cssVar: "--color-element-info",
    figmaToken: "Element / Info",
    tailwindClass: "bg-element-info"
  },
  {
    cssVar: "--color-element-in-progress",
    figmaToken: "Element / In Progress",
    tailwindClass: "bg-element-in-progress"
  }
];

const SURFACE_COLORS: ColorSwatchProps[] = [
  {
    cssVar: "--color-surface-primary",
    figmaToken: "Surface / Primary",
    tailwindClass: "bg-surface-primary"
  },
  {
    cssVar: "--color-surface-secondary",
    figmaToken: "Surface / Secondary",
    tailwindClass: "bg-surface-secondary"
  },
  {
    cssVar: "--color-surface-on-image",
    figmaToken: "Surface / On Image",
    tailwindClass: "bg-surface-on-image"
  },
  {
    cssVar: "--color-surface-modal-backdrop",
    figmaToken: "Surface / Modal Backdrop",
    tailwindClass: "bg-surface-modal-backdrop"
  },
  {
    cssVar: "--color-surface-bg-100",
    figmaToken: "Surface / BG 100",
    tailwindClass: "bg-surface-bg-100"
  },
  {
    cssVar: "--color-surface-bg-200",
    figmaToken: "Surface / BG 200",
    tailwindClass: "bg-surface-bg-200"
  },
  {
    cssVar: "--color-surface-bg-300",
    figmaToken: "Surface / BG 300",
    tailwindClass: "bg-surface-bg-300"
  },
  {
    cssVar: "--color-surface-bg-400",
    figmaToken: "Surface / BG 400",
    tailwindClass: "bg-surface-bg-400"
  },
  {
    cssVar: "--color-surface-bg-500",
    figmaToken: "Surface / BG 500",
    tailwindClass: "bg-surface-bg-500"
  }
];

const CODE_COLORS: ColorSwatchProps[] = [
  {
    cssVar: "--color-code-100",
    figmaToken: "Code / 100",
    tailwindClass: "text-code-100"
  },
  {
    cssVar: "--color-code-200",
    figmaToken: "Code / 200",
    tailwindClass: "text-code-200"
  },
  {
    cssVar: "--color-code-300",
    figmaToken: "Code / 300",
    tailwindClass: "text-code-300"
  },
  {
    cssVar: "--color-code-400",
    figmaToken: "Code / 400",
    tailwindClass: "text-code-400"
  }
];

type GradientSwatchProps = {
  name: string;
  tailwindClass: string;
  gradient: string;
};

const GradientSwatch = ({
  name,
  tailwindClass,
  gradient
}: GradientSwatchProps) => (
  <div className="flex items-center gap-3">
    <div
      className="w-10 h-10 rounded-lg border border-glyph-stroke shrink-0"
      style={{ background: gradient }}
    />
    <div className="flex flex-col gap-0.5 min-w-0">
      <Text
        component="span"
        variant="xs"
        weight="semibold"
        color="glyph-primary"
      >
        {name}
      </Text>
      <Text component="span" variant="xs" color="glyph-tertiary">
        {tailwindClass}
      </Text>
    </div>
  </div>
);

const GRADIENTS: GradientSwatchProps[] = [
  {
    name: "Gradient / Primary",
    tailwindClass: "from-gradient-primary-start to-gradient-primary-end",
    gradient:
      "linear-gradient(90deg, var(--color-gradient-primary-start), var(--color-gradient-primary-end))"
  },
  {
    name: "Gradient / Secondary",
    tailwindClass: "from-gradient-secondary-start to-gradient-secondary-end",
    gradient:
      "linear-gradient(90deg, var(--color-gradient-secondary-start), var(--color-gradient-secondary-end))"
  },
  {
    name: "Gradient / 100",
    tailwindClass: "bg-gradient-100",
    gradient: "linear-gradient(to right, #332af5, #ff523b)"
  },
  {
    name: "Gradient / 200",
    tailwindClass: "bg-gradient-200",
    gradient:
      "linear-gradient(66deg, rgba(11, 13, 30, 0.3) 30.84%, rgba(101, 111, 255, 0.3) 92.76%)"
  }
];

const ColorsPage = () => (
  <div className="bg-surface-primary p-8 h-screen overflow-y-auto flex flex-col gap-10">
    <Text component="h1" variant="xl" weight="bold" color="glyph-primary">
      Design System Colors
    </Text>

    <Section title="Glyph" colors={GLYPH_COLORS} />
    <Section title="Element" colors={ELEMENT_COLORS} />
    <Section title="Surface" colors={SURFACE_COLORS} />
    <Section title="Color Code" colors={CODE_COLORS} />

    <div className="flex flex-col gap-4">
      <Text component="h2" variant="lg" weight="bold" color="glyph-primary">
        Gradient
      </Text>
      <div className="grid grid-cols-4 gap-x-8 gap-y-4">
        {GRADIENTS.map((g) => (
          <GradientSwatch key={g.name} {...g} />
        ))}
      </div>
    </div>
  </div>
);

const meta = {
  title: "Colors",
  component: ColorsPage,
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta<typeof ColorsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllColors: Story = {};
