import { useEffect, useRef, useState } from "react";

export function useCountUp(target = 0, { duration = 1200, decimals = 0 } = {}) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const numericTarget = Number(target) || 0;
    startRef.current = null;

    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp) => {
      if (startRef.current === null) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      setValue(numericTarget * ease(progress));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setValue(numericTarget);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
