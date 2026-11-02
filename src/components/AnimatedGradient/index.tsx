import { useMountEffect } from "@hooks/useMountEffect";
import { useRef } from "react";

const COLORS = ["#7B23A1", "#1212B9", "#38D0DC", "#6767E3", "#38D0DC"];
const DOT_COUNT = 5;
const MARGIN_X = 30;
const MARGIN_Y = 20;
const HALF = 0.5;
const CENTER_VELOCITY = 0.25;
const ANGULAR_VELOCITY_BASE = 0.01;
const RADIUS_MIN = 20;
const RADIUS_RANGE = 25;
const RADIUS_VELOCITY = 0.03;
const SPIRAL_RADIUS_MIN = 12;
const SPIRAL_RADIUS_MAX = 45;
const GLOW_RADIUS = 150;
const POSITION_RANDOMNESS = 20;
const REVERSE_DIRECTION = -1;

export const AnimatedGradient: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useMountEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const getBoxDimensions = () => ({
      boxWidth: canvas.width,
      boxHeight: canvas.height,
      boxX: 0,
      boxY: 0
    });

    const initializeDots = () => {
      const { boxWidth, boxHeight, boxX, boxY } = getBoxDimensions();
      return Array.from({ length: DOT_COUNT }, (_, i) => ({
        cx:
          boxX +
          MARGIN_X +
          ((i + HALF) * (boxWidth - 2 * MARGIN_X)) / DOT_COUNT +
          (Math.random() - HALF) * POSITION_RANDOMNESS,
        cy: boxY + MARGIN_Y + Math.random() * (boxHeight - 2 * MARGIN_Y),
        cvx: (Math.random() - HALF) * CENTER_VELOCITY,
        cvy: (Math.random() - HALF) * CENTER_VELOCITY,
        angle: Math.random() * Math.PI * 2,
        angVel: ANGULAR_VELOCITY_BASE + Math.random() * ANGULAR_VELOCITY_BASE,
        r: RADIUS_MIN + Math.random() * RADIUS_RANGE,
        rVel: (Math.random() < HALF ? REVERSE_DIRECTION : 1) * RADIUS_VELOCITY,
        col: COLORS[i % COLORS.length]
      }));
    };

    const dots = initializeDots();
    let animationId: number;

    const animate = () => {
      const { boxWidth, boxHeight, boxX, boxY } = getBoxDimensions();

      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];

        d.cx += d.cvx;
        d.cy += d.cvy;

        if (d.cx < boxX + MARGIN_X || d.cx > boxX + boxWidth - MARGIN_X)
          d.cvx *= REVERSE_DIRECTION;
        if (d.cy < boxY + MARGIN_Y || d.cy > boxY + boxHeight - MARGIN_Y)
          d.cvy *= REVERSE_DIRECTION;

        d.angle += d.angVel;
        d.r += d.rVel;
        if (d.r < SPIRAL_RADIUS_MIN || d.r > SPIRAL_RADIUS_MAX)
          d.rVel *= REVERSE_DIRECTION;

        const x = d.cx + Math.cos(d.angle) * d.r;
        const y = d.cy + Math.sin(d.angle) * d.r;

        if (x < boxX || x > boxX + boxWidth) d.angVel *= REVERSE_DIRECTION;
        if (y < boxY || y > boxY + boxHeight) d.angVel *= REVERSE_DIRECTION;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, GLOW_RADIUS);
        gradient.addColorStop(0, d.col);
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.filter = "blur(50px)";
        ctx.arc(x, y, GLOW_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = "none";
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  });

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ pointerEvents: "none" }}
    />
  );
};
