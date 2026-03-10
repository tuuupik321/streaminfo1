import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

type CounterProps = {
  from: number;
  to: number;
  duration?: number;
};

export function AnimatedCounter({ from, to, duration = 0.5 }: CounterProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(from, to, {
      duration,
      ease: "easeOut",
      onUpdate(value) {
        node.textContent = Math.round(value).toString();
      },
    });

    return () => controls.stop();
  }, [from, to, duration]);

  return <span ref={nodeRef} />;
}
