import { useEffect, useState } from "react";

/**
 * Re-renders the caller every `intervalMs` with the current timestamp.
 * Default 1s — fine for second-resolution countdowns.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
