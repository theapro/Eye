"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { useCameraTracking } from "../../hooks/useCameraTracking";
import { useCreepyBehavior } from "../../hooks/useCreepyBehavior";
import { useEyeTracking } from "../../hooks/useEyeTracking";

interface EyeProps {
  irisSrc?: string;
  eyelidSrc?: string;
  className?: string;
  size?: string;
}

export const Eye: React.FC<EyeProps> = ({
  irisSrc = "/eyeiris2.png",
  eyelidSrc = "/eye.png",
  className = "",
  size = "w-64 sm:w-80 md:w-[750px]", // default
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isAngry, setIsAngry] = useState(false);

  // Hooks
  const { facePosition } = useCameraTracking();
  const { isLockedRef, wanderOffsetRef } = useCreepyBehavior();
  const { update } = useEyeTracking(
    containerRef,
    facePosition,
    isLockedRef,
    wanderOffsetRef,
    isBlinking,
  );

  // Irises state for angry mode
  const [irises, setIrises] = useState([
    { id: 0, x: 0, y: 0, scale: 0.5, phase: 0, offset: 0 },
  ]);

  useEffect(() => {
    if (isAngry) {
      setIrises([
        { id: 0, x: 0, y: 0, scale: 0.8, phase: 0, offset: 0 },
        { id: 1, x: 40, y: -30, scale: 0.8, phase: Math.PI * 0.66, offset: 20 },
        {
          id: 2,
          x: -40,
          y: 30,
          scale: 0.8,
          phase: Math.PI * 1.33,
          offset: -20,
        },
      ]);
    } else {
      setIrises([{ id: 0, x: 0, y: 0, scale: 1, phase: 0, offset: 0 }]);
    }
  }, [isAngry]);

  // Blink scheduler
  useEffect(() => {
    let blinkTimeout: number;

    const scheduleBlink = () => {
      const delay = isAngry
        ? Math.random() * 2000 + 1000
        : Math.random() * 5500 + 3500;
      blinkTimeout = window.setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 150);
      }, delay);
    };

    scheduleBlink();
    return () => clearTimeout(blinkTimeout);
  }, [isAngry]);

  // Eye movement & iris squash during blink
  useEffect(() => {
    setMounted(true);
    let rafId: number;

    const tick = (time: number) => {
      const state = update(time);

      setIrises((prev) => {
        if (!isAngry) {
          return [
            {
              ...prev[0],
              x: state.x,
              y: state.y,
              scale: state.scale,
            },
          ];
        }

        // Calculate new positions with defined directions (circular/elliptical paths)
        const nextPositions = prev.map((iris, i) => {
          const speed = 0.002;
          const radiusX = 100;
          const radiusY = 70;

          // Defined patterns: Iris 0 follows user mostly, others orbit
          let tx = state.x;
          let ty = state.y;

          if (i === 1) {
            tx += Math.sin(time * speed + iris.phase) * radiusX;
            ty += Math.cos(time * speed + iris.phase) * radiusY;
          } else if (i === 2) {
            tx += Math.cos(time * speed + iris.phase) * radiusX;
            ty += Math.sin(time * speed + iris.phase) * radiusY;
          }

          // Subtle shaking
          const shake = Math.sin(time * 0.05 + i) * 2;

          let nx = iris.x + (tx - iris.x) * 0.05 + shake;
          let ny = iris.y + (ty - iris.y) * 0.05 + shake;

          return { ...iris, x: nx, y: ny };
        });

        // Resolve collisions in multiple passes to ensure 0px overlap
        for (let pass = 0; pass < 3; pass++) {
          for (let i = 0; i < nextPositions.length; i++) {
            for (let j = i + 1; j < nextPositions.length; j++) {
              const a = nextPositions[i];
              const b = nextPositions[j];
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const dist = Math.hypot(dx, dy);
              const minDist = 135; // Size (30% of ~750px is ~225px, scale 0.5 is ~112px. 135 ensures gap)

              if (dist < minDist) {
                const overlap = minDist - dist;
                const angle = Math.atan2(dy, dx);
                const moveX = Math.cos(angle) * (overlap / 2);
                const moveY = Math.sin(angle) * (overlap / 2);

                nextPositions[i].x -= moveX;
                nextPositions[i].y -= moveY;
                nextPositions[j].x += moveX;
                nextPositions[j].y += moveY;
              }
            }
          }
        }

        // Clamp to eyelid boundaries
        return nextPositions.map((iris) => {
          const distToCenter = Math.hypot(iris.x, iris.y);
          const maxRadius = 160;
          if (distToCenter > maxRadius) {
            const angle = Math.atan2(iris.y, iris.x);
            iris.x = Math.cos(angle) * maxRadius;
            iris.y = Math.sin(angle) * maxRadius;
          }
          return iris;
        });
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [update, isAngry]);

  if (!mounted) return <div className={`bg-black rounded-full ${className}`} />;

  return (
    <div className="flex flex-col items-center gap-12">
      <div
        ref={containerRef}
        className={[
          "relative aspect-square select-none group",
          size,
          className,
        ].join(" ")}
      >
        {/* Depth glow */}
        <div
          className="absolute inset-[20%] rounded-full bg-white/25 blur-lg pointer-events-none transition-opacity duration-500 group-hover:bg-white/35"
          aria-hidden="true"
        />

        {/* Irises */}
        {irises.map((iris) => (
          <div
            key={iris.id}
            className="absolute left-1/2 top-1/2 z-10 w-[30%] h-[30%] will-change-transform"
            style={{
              transform: `
                translate(-50%, -50%) 
                translate(${iris.x.toFixed(2)}px, ${iris.y.toFixed(2)}px)
                scale(${iris.scale.toFixed(3)})
                scaleY(${isBlinking ? 0.05 : 1})
              `,
            }}
          >
            <Image
              src={irisSrc}
              alt="Iris"
              fill
              priority
              draggable={false}
              className="object-contain drop-shadow-xl brightness-90 group-hover:brightness-110 transition-[filter] duration-300"
            />
          </div>
        ))}

        {/* Eyelid */}
        <div
          className={`pointer-events-none absolute inset-0 z-20 origin-center transition-transform duration-[1ms] ease-in-out`}
          style={{ transform: `scaleY(${isBlinking ? 0.05 : 1})` }}
        >
          <Image
            src={eyelidSrc}
            alt="Eyelid"
            fill
            priority
            draggable={false}
            className="object-contain"
          />
        </div>

        {/* Gloss reflection */}
        <div className="absolute inset-0 z-30 pointer-events-none opacity-[0.08] bg-[linear-gradient(135deg,_white_0%,_transparent_50%)] rounded-full" />
      </div>
{/* 
      <button
        onClick={() => setIsAngry(!isAngry)}
        className={`px-8 py-3 rounded-full font-black tracking-widest transition-all duration-300 transform active:scale-95 ${
          isAngry
            ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse"
            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700"
        }`}
      >
        {isAngry ? "CALM DOWN" : "ANGRY MODE"}
      </button> */}
    </div>
  );
};

export default Eye;
