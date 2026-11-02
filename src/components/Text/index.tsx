import {
  CodePalette,
  ElementPalette,
  GlyphPalette,
  SeverityPalette
} from "@styles/types";
import { cn } from "@utils";
import React, { forwardRef } from "react";

type Props = {
  align?: "left" | "center" | "right";
  children?: React.ReactNode;
  className?: string;
  color?:
    | GlyphPalette
    | CodePalette
    | ElementPalette
    | SeverityPalette
    | "inherit";
  component?: "div" | "h1" | "h2" | "h3" | "h4" | "p" | "span" | "time";
  "data-testid"?: string;
  decoration?: "underline";
  disabled?: boolean;
  lineHeight?: "relaxed" | "snug";
  overflow?: "hidden";
  select?: "none";
  textOverflow?: "ellipsis";
  variant?: "3xl" | "2xs" | "xl" | "lg" | "base" | "md" | "sm" | "xs";
  weight?: "bold" | "medium" | "normal" | "semibold";
  whiteSpace?: "nowrap" | "pre-line" | "pre-wrap";
};

const variantClasses: Record<string, string> = {
  "3xl": "text-3xl",
  "2xs": "text-2xs",
  xl: "text-xl",
  lg: "text-lg",
  base: "text-base",
  md: "text-md",
  sm: "text-sm",
  xs: "text-xs"
};

const weightClasses: Record<string, string> = {
  bold: "font-bold",
  medium: "font-medium",
  normal: "font-normal",
  semibold: "font-semibold"
};

export const colorClasses: Record<string, string> = {
  "glyph-primary": "text-glyph-primary",
  "glyph-secondary": "text-glyph-secondary",
  "glyph-tertiary": "text-glyph-tertiary",
  "glyph-disabled": "text-glyph-disabled",
  "glyph-error": "text-glyph-error",
  "glyph-warning": "text-glyph-warning",
  "glyph-success": "text-glyph-success",
  "glyph-action-main": "text-glyph-action-main",
  "glyph-primary-on-pic": "text-glyph-primary-on-pic",
  "glyph-invert-main": "text-glyph-invert-main",
  "code-100": "text-code-100",
  "code-200": "text-code-200",
  "element-in-progress": "text-element-in-progress",
  error: "text-severity-error",
  success: "text-severity-success",
  warning: "text-severity-warning",
  inherit: "text-inherit"
};

const alignClasses: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right"
};

const lineHeightClasses: Record<string, string> = {
  relaxed: "leading-relaxed",
  snug: "leading-snug"
};

const whiteSpaceClasses: Record<string, string> = {
  nowrap: "whitespace-nowrap",
  "pre-line": "whitespace-pre-line",
  "pre-wrap": "whitespace-pre-wrap"
};

export const Text = forwardRef<HTMLElement, Props>(function Text(
  {
    align,
    children,
    className,
    color = "glyph-primary",
    component = "p",
    decoration,
    disabled,
    lineHeight,
    overflow,
    select,
    textOverflow,
    variant = "base",
    weight = "normal",
    whiteSpace,
    ...props
  },
  ref
) {
  const componentProps = {
    className: cn(
      "font-lato",
      variantClasses[variant],
      weightClasses[weight],
      colorClasses[color],
      disabled && "text-glyph-disabled",
      align && alignClasses[align],
      lineHeight && lineHeightClasses[lineHeight],
      decoration,
      overflow && "overflow-hidden",
      textOverflow && "text-ellipsis",
      select && "select-none",
      whiteSpace && whiteSpaceClasses[whiteSpace],
      className
    ),
    ref,
    ...props
  };
  return React.createElement(component, componentProps, children);
});
