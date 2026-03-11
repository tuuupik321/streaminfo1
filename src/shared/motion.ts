import type { Variants } from "framer-motion";

export function makeStagger(reduced: boolean): Variants {
  if (reduced) {
    return { hidden: { opacity: 1 }, show: { opacity: 1 } };
  }
  return {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
}

export function makeFadeUp(reduced: boolean): Variants {
  if (reduced) {
    return { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } };
  }
  return {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  };
}
