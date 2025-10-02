import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";

/**
 * @typedef {Object} AnimatedGradientBackgroundProps
 * @property {React.ReactNode} children
 * @property {string} [className]
 * @property {"subtle" | "medium" | "strong"} [intensity]
 * @property {"slow" | "medium" | "fast"} [speed]
 * @property {React.HTMLAttributes<HTMLDivElement>} [props]
 */

const intensityValues = {
  subtle: { opacity: 0.06, size: 150 },
  medium: { opacity: 0.12, size: 200 },
  strong: { opacity: 0.2, size: 250 },
};

const speedValues = {
  slow: 0.01,
  medium: 0.02,
  fast: 0.04,
};

export function AnimatedGradientBackground({
  children,
  className,
  intensity = "subtle",
  speed = "medium",
  ...props
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    const resizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });

    resizeObserver.observe(canvas);

    // Generate 3 random gradient positions
    const positions = Array.from({ length: 3 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: Math.random() * 0.2 - 0.1,
      vy: Math.random() * 0.2 - 0.1,
    }));

    const gradientColors = [
      ["rgba(125, 211, 252, 1)", "rgba(15, 118, 110, 1)"], // Sky to teal
      ["rgba(167, 139, 250, 1)", "rgba(79, 70, 229, 1)"], // Purple to indigo
      ["rgba(251, 113, 133, 1)", "rgba(190, 24, 93, 1)"], // Rose to pink
    ];

    const animate = () => {
      if (!canvas || !ctx) return;
      time += speedValues[speed];

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update positions
      positions.forEach((pos, i) => {
        pos.x += pos.vx;
        pos.y += pos.vy;

        // Bounce off edges
        if (pos.x < 0 || pos.x > canvas.width) pos.vx *= -1;
        if (pos.y < 0 || pos.y > canvas.height) pos.vy *= -1;

        // Create gradient
        const size = intensityValues[intensity].size;
        const gradient = ctx.createRadialGradient(
          pos.x,
          pos.y,
          0,
          pos.x,
          pos.y,
          size + 50 * Math.sin(time * 0.3 + i)
        );

        gradient.addColorStop(0, gradientColors[i][0]);
        gradient.addColorStop(1, gradientColors[i][1]);

        ctx.globalAlpha = intensityValues[intensity].opacity;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
          pos.x,
          pos.y,
          size + 50 * Math.sin(time * 0.3 + i),
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      resizeObserver.disconnect();
    };
  }, [intensity, speed]);

  return (
    <div className={cn("relative", className)} {...props}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full -z-10"
      />
      {children}
    </div>
  );
}
