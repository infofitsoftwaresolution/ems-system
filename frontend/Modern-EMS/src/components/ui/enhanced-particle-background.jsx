import { useRef, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const EnhancedParticleBackground = ({
  particleCount = 50,
  particleSize = 2,
  particleColors = [
    "rgba(59, 130, 246, 0.5)",
    "rgba(99, 102, 241, 0.5)",
    "rgba(139, 92, 246, 0.5)",
  ],
  connectParticles = true,
  interactive = true,
  intensity = "medium",
  className = "",
}) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: null, y: null });
  const animationRef = useRef(null);

  // Apply intensity settings
  const intensitySettings = {
    subtle: {
      opacity: 0.3,
      speed: 0.2,
      connectionDistance: 100,
      connectionOpacity: 0.1,
    },
    medium: {
      opacity: 0.5,
      speed: 0.5,
      connectionDistance: 150,
      connectionOpacity: 0.2,
    },
    intense: {
      opacity: 0.7,
      speed: 1.0,
      connectionDistance: 200,
      connectionOpacity: 0.3,
    },
  };

  const settings = intensitySettings[intensity];

  // Setup particles and animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Reset particles with new dimensions
        initializeParticles();
      }
    };

    const initializeParticles = () => {
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * particleSize + 1,
        color:
          particleColors[Math.floor(Math.random() * particleColors.length)],
        speedX: (Math.random() - 0.5) * settings.speed,
        speedY: (Math.random() - 0.5) * settings.speed,
        opacity: Math.random() * settings.opacity + 0.1,
      }));
    };

    const drawParticles = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particles and connections
      particlesRef.current.forEach((particle, i) => {
        // Update particle position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Boundary checking
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX = -particle.speedX;
        }

        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY = -particle.speedY;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        // Mouse interaction
        if (
          interactive &&
          mouseRef.current.x !== null &&
          mouseRef.current.y !== null
        ) {
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            const angle = Math.atan2(dy, dx);
            particle.x -= Math.cos(angle) * 1;
            particle.y -= Math.sin(angle) * 1;
          }
        }

        // Draw connections
        if (connectParticles) {
          for (let j = i + 1; j < particlesRef.current.length; j++) {
            const p2 = particlesRef.current[j];
            const dx = particle.x - p2.x;
            const dy = particle.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < settings.connectionDistance) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(99, 102, 241, ${
                settings.connectionOpacity *
                (1 - distance / settings.connectionDistance)
              })`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      });

      animationRef.current = requestAnimationFrame(drawParticles);
    };

    const handleMouseMove = (e) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };

    // Initialize and start animation
    handleResize();
    drawParticles();

    window.addEventListener("resize", handleResize);
    if (interactive) {
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (interactive && canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    particleCount,
    particleSize,
    connectParticles,
    particleColors,
    interactive,
    settings,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className={`absolute inset-0 z-0 overflow-hidden pointer-events-none ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ pointerEvents: interactive ? "auto" : "none" }}
      />
    </motion.div>
  );
};
