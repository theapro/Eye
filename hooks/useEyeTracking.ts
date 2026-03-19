import { useRef, useEffect } from "react";

export interface EyeState {
  x: number;
  y: number;
  scale: number;
}

export const useEyeTracking = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  _facePosition: React.MutableRefObject<{ x: number; y: number }>,
  isLocked: React.MutableRefObject<boolean>,
  wanderOffset: React.MutableRefObject<{ x: number; y: number }>,
  _isBlinking: boolean,
) => {
  const stateRef = useRef<EyeState>({ x: 0, y: 0, scale: 1 });
  const rawTargetRef = useRef({ x: 0, y: 0 });
  const smoothedTargetRef = useRef({ x: 0, y: 0 });

  const jitterRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Distance from center
      rawTargetRef.current = {
        x: e.clientX - centerX,
        y: e.clientY - centerY,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [containerRef]);

  const update = (time: number) => {
    if (!containerRef.current) return stateRef.current;

    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Movement Bounds (Ellipse)
    // Travel radius ~ (container - iris) / 2
    const irisSize = w * 0.42;
    const maxX = (w - irisSize) * 0.45;
    const maxY = (h - irisSize) * 0.35; // Flatter ellipse for lateral preference

    // Target logic
    let tx = rawTargetRef.current.x * 0.2; // Mouse scaling
    let ty = rawTargetRef.current.y * 0.2;

    if (isLocked.current) {
      tx = 0;
      ty = 0;
    } else {
      tx += wanderOffset.current.x;
      ty += wanderOffset.current.y;
    }

    // Clamp to Ellipse: (x/a)^2 + (y/b)^2 <= 1
    const distSq = (tx * tx) / (maxX * maxX) + (ty * ty) / (maxY * maxY);
    if (distSq > 1) {
      const scale = 1 / Math.sqrt(distSq);
      tx *= scale;
      ty *= scale;
    }

    // Smooth Lerp (Unsettlingly slow/intentional)
    const lerpFactor = 0.08;
    smoothedTargetRef.current.x +=
      (tx - smoothedTargetRef.current.x) * lerpFactor;
    smoothedTargetRef.current.y +=
      (ty - smoothedTargetRef.current.y) * lerpFactor;

    // Subtle Breathing / Jitter
    const jitterSpeed = 0.005;
    jitterRef.current.x = Math.sin(time * jitterSpeed) * 0.8;
    jitterRef.current.y = Math.cos(time * jitterSpeed * 0.7) * 0.6;

    // Zoom on speed
    const velocity = Math.hypot(
      tx - smoothedTargetRef.current.x,
      ty - smoothedTargetRef.current.y,
    );
    const targetScale = 1 + Math.min(0.05, velocity * 0.001);
    stateRef.current.scale += (targetScale - stateRef.current.scale) * 0.1;

    stateRef.current.x = smoothedTargetRef.current.x + jitterRef.current.x;
    stateRef.current.y = smoothedTargetRef.current.y + jitterRef.current.y;

    return stateRef.current;
  };

  return { update, stateRef };
};
