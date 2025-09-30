import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  fadeIn,
  slideUp,
  slideRight,
  staggerContainer,
  scaleIn,
  hover,
} from "./motion-variants";

// Motion components
export function MotionDiv({
  children,
  className,
  variant = "fadeIn",
  animate = "visible",
  delay = 0,
  ...props
}) {
  const variants = {
    fadeIn,
    slideUp,
    slideRight,
    scaleIn,
    staggerContainer,
  };

  return (
    <motion.div
      initial="hidden"
      animate={animate}
      variants={variants[variant]}
      className={cn(className)}
      transition={{ delay }}
      {...props}>
      {children}
    </motion.div>
  );
}

export const MotionCard = motion.div;
export const MotionButton = motion.button;

// Export motion variants
export { hover };
