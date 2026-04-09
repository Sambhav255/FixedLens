import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  format: (n: number) => string;
  className?: string;
  durationMs?: number;
}

export function AnimatedNumber({
  value,
  format,
  className,
  durationMs = 300,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    fromRef.current = to;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, durationMs]);

  return <span className={`metric-pop ${className ?? ""}`}>{format(display)}</span>;
}
