import { useRef, useEffect } from "react";

/**
 * Adds unsettling behavior:
 * - Lock stare at center
 * - Idle wandering
 * - Reaction delay
 */
export const useCreepyBehavior = () => {
  const isLockedRef = useRef(false);
  const wanderOffsetRef = useRef({ x: 0, y: 0 });
  const lastStateChangeRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastStateChangeRef.current < 2000) return;

      const rand = Math.random();

      if (rand > 0.92) {
        // Lock stare at center for 1-2 seconds
        isLockedRef.current = true;
        lastStateChangeRef.current = now;
        setTimeout(() => {
          isLockedRef.current = false;
        }, 1500);
      } else if (rand < 0.3) {
        // Idle wander
        wanderOffsetRef.current = {
          x: (Math.random() - 0.5) * 40,
          y: (Math.random() - 0.5) * 20,
        };
      } else {
        wanderOffsetRef.current = { x: 0, y: 0 };
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { isLockedRef, wanderOffsetRef };
};
