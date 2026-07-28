/* ===================================================================
   Merit Real Solutions ERP — Framer Motion Animation Presets
   Durations/easings mirror styles/tokens/motion.css (UI SSOT).
   Import:  import { fadeUp, EASE, DURATION } from "animations/presets";
   =================================================================== */

/** Matches --erp-ease-entrance */
export const EASE = [0.22, 1, 0.36, 1];

/** Matches --erp-ease-standard */
export const EASE_STANDARD = [0.4, 0, 0.2, 1];

/** Matches --erp-ease-exit */
export const EASE_EXIT = [0.4, 0, 1, 1];

/** Matches --erp-duration-* (seconds for Framer Motion) */
export const DURATION = {
  100: 0.1,
  150: 0.15,
  250: 0.25,
  400: 0.4,
  600: 0.6,
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION[250], ease: EASE },
};

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: DURATION[400], ease: EASE },
};

export const fadeDown = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATION[400], ease: EASE },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: { duration: DURATION[250], ease: EASE },
};

export const slideLeft = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
  transition: { duration: DURATION[400], ease: EASE },
};

export const slideRight = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: DURATION[400], ease: EASE },
};

export const drawerMotion = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
  transition: { duration: DURATION[400], ease: EASE },
};

export const overlayMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION[250], ease: EASE_STANDARD },
};

export const modalMotion = {
  initial: { opacity: 0, scale: 0.94, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 8 },
  transition: { duration: DURATION[250], ease: EASE },
};

export const cardHover = {
  whileHover: { y: -4 },
  transition: { duration: DURATION[250], ease: EASE },
};

export const rowMotion = (index = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATION[250], delay: index * 0.035, ease: EASE },
});

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATION[400], ease: EASE },
};
