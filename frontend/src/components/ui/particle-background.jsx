import React, { useEffect, useRef } from "react";

export function ParticleBackground({
  className = "",
  particleCount = 50,
  particleSize = 2,
  particleColor = "#3b82f6",
  connectParticles = true,
  interactive = true,
}) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const handleMouseMove = (e) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mousePositionRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * particleSize + 1,
          speedX: (Math.random() - 0.5) * 0.8,
          speedY: (Math.random() - 0.5) * 0.8,
          color: particleColor,
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Connect particles
        if (connectParticles) {
          for (let j = i + 1; j < particlesRef.current.length; j++) {
            const p2 = particlesRef.current[j];
            const distance = Math.sqrt(
              Math.pow(p.x - p2.x, 2) + Math.pow(p.y - p2.y, 2)
            );

            if (distance < 120) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(59, 130, 246, ${1 - distance / 120})`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }

        // Interactive effect with mouse
        if (interactive) {
          const mouseDistance = Math.sqrt(
            Math.pow(p.x - mousePositionRef.current.x, 2) +
              Math.pow(p.y - mousePositionRef.current.y, 2)
          );

          if (mouseDistance < 120) {
            const angle = Math.atan2(
              p.y - mousePositionRef.current.y,
              p.x - mousePositionRef.current.x
            );
            p.speedX += Math.cos(angle) * 0.1;
            p.speedY += Math.sin(angle) * 0.1;
          }
        }

        // Update position
        p.x += p.speedX;
        p.y += p.speedY;

        // Slow down particles
        p.speedX *= 0.98;
        p.speedY *= 0.98;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.y < 0) p.y = canvas.height;
        if (p.x > canvas.width) p.x = 0;
        if (p.y > canvas.height) p.y = 0;
      }

      animationFrameRef.current = requestAnimationFrame(drawParticles);
    };

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouseMove);

    handleResize();
    drawParticles();

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    particleCount,
    particleSize,
    particleColor,
    connectParticles,
    interactive,
  ]);

  return (
    <canvas ref={canvasRef} className={`absolute inset-0 -z-10 ${className}`} />
  );
}
