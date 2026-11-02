import React, { useState } from "react";

type CursorState = {
  x: number;
  y: number;
  visible: boolean;
};

export const useBrushCursor = () => {
  const [cursor, setCursor] = useState<CursorState>({
    x: 0,
    y: 0,
    visible: false
  });

  const onPointerMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true
    });
  };

  const onPointerLeave = () => {
    setCursor((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  };

  return { cursor, onPointerMove, onPointerLeave };
};
