import { useRef, useEffect, useState } from "react";

export const useBlink = (enabled: boolean = true) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(false);

  const triggerBlink = () => {
    if (!isMounted.current) return;

    setIsBlinking(true);

    // Normal blink duration 120-180ms
    setTimeout(() => {
      if (!isMounted.current) return;
      setIsBlinking(false);

      // Rare double blink (15% chance)
      if (Math.random() > 0.85) {
        setTimeout(() => {
          if (!isMounted.current) return;
          setIsBlinking(true);
          setTimeout(() => {
            if (isMounted.current) setIsBlinking(false);
          }, 140);
        }, 80);
      }
    }, 150);
  };

  useEffect(() => {
    isMounted.current = true;

    const scheduleNextBlink = () => {
      if (!enabled || !isMounted.current) return;

      const delay = 3000 + Math.random() * 7000; // 3s - 10s
      timeoutRef.current = setTimeout(() => {
        triggerBlink();
        scheduleNextBlink();
      }, delay);
    };

    scheduleNextBlink();

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled]);

  return isBlinking;
};
