"use client";

import p5 from "p5";
import { useEffect, useRef } from "react";

// Animation constants
const ANIMATION_CONFIG = {
  TRANSITION_DURATION: "duration-100", // Tailwind duration class
  EASING: "ease-out", // CSS easing function
} as const;

// Particle animation constants
const PARTICLE_CONFIG = {
  ORBIT_RADIUS_RATIO: 0.5, // Orbit radius as a ratio of canvas size
  BASE_SIZE_RATIO: 0.5, // Base size of particles as a ratio of canvas size
  SIZE_OSCILLATION_AMOUNT: 0.1, // How much the size varies (±40%)
  SIZE_FREQUENCY_BASE: 0.08, // Base frequency for size oscillation
  SIZE_FREQUENCY_VARIATION: 0.03, // Frequency variation between particles
} as const;

type SphereVisualizerProps = {
  size?: number;
  colors?: string[];
  backgroundColor?: string;
  opacity?: number;
  speed?: number;
  scale?: number;
  overflow?: "hidden" | "visible";
};

export const SphereVisualizer = ({
  size = 200,
  scale = 1,
  colors = ["#3b82f6"],
  backgroundColor = "transparent",
  opacity = 1,
  speed = 1,
  overflow = "hidden",
}: SphereVisualizerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const propsRef = useRef({ colors, backgroundColor, opacity, speed });

  // Update props ref when props change (without recreating sketch)
  useEffect(() => {
    propsRef.current = { colors, backgroundColor, opacity, speed };
  }, [colors, backgroundColor, opacity, speed]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let accumulatedTime = 0; // Track time independently of speed changes

      p.setup = () => {
        p.createCanvas(size, size); // 2D canvas instead of WEBGL
      };

      p.draw = () => {
        const { colors, backgroundColor, opacity, speed } = propsRef.current;

        // Accumulate time based on current speed (instead of using frameCount)
        accumulatedTime += 0.015 * speed;

        // Set background
        if (backgroundColor === "transparent") {
          p.clear();
        } else {
          p.background(backgroundColor);
        }

        // Center coordinates
        const centerX = size / 2;
        const centerY = size / 2;

        // Store circle positions for visualization
        const circlePositions: { x: number; y: number; color: string }[] = [];

        // Create multiple moving colored circles from dominant colors - use accumulated time
        const time = accumulatedTime;

        colors.forEach((color, index) => {
          // Different frequencies and phase offsets for each circle (more circular)
          const freqX = 1.0 + index * 0.1; // Subtle frequency variations for near-circular motion
          const freqY = 1.0 + index * 0.12;
          const phaseOffset = (index * p.PI * 2) / colors.length; // Distribute around circle

          // Position circles around the main circle with gentle movement
          const radius = size * PARTICLE_CONFIG.ORBIT_RADIUS_RATIO;

          const circleX = centerX + p.cos(time * freqX + phaseOffset) * radius;
          const circleY = centerY + p.sin(time * freqY + phaseOffset) * radius;

          // Store position for visualization
          circlePositions.push({ x: circleX, y: circleY, color });
        });

        // Draw the main circle
        // Set fill color - animate through all dominant colors
        let circleColor;
        if (colors.length > 1) {
          // Calculate which color we're transitioning between - use accumulated time
          const colorCycleSpeed = 0.01;
          const colorTime = (accumulatedTime * colorCycleSpeed) % colors.length;
          const currentColorIndex = Math.floor(colorTime);
          const nextColorIndex = (currentColorIndex + 1) % colors.length;
          const lerpAmount = colorTime - currentColorIndex;

          // Interpolate between current and next color
          const currentColor = p.color(colors[currentColorIndex]);
          const nextColor = p.color(colors[nextColorIndex]);
          circleColor = p.lerpColor(currentColor, nextColor, lerpAmount);
        } else {
          circleColor = p.color(colors[0] || "#fff");
        }

        circleColor.setAlpha(opacity * 255);
        p.fill(circleColor);
        p.noStroke();

        // Draw the main circle at center
        p.circle(centerX, centerY, size); // Main circle diameter equals canvas size

        // Draw colored particle circles
        circlePositions.forEach((circle, index) => {
          // Calculate dynamic size with smooth growing/shrinking animation
          const sizeFreq =
            PARTICLE_CONFIG.SIZE_FREQUENCY_BASE +
            index * PARTICLE_CONFIG.SIZE_FREQUENCY_VARIATION;
          const sizePhase = (index * p.PI) / colors.length; // Phase offset for variation
          const sizeOscillation = p.sin(accumulatedTime * sizeFreq + sizePhase);

          // Base size with oscillation
          const baseSizeRatio = PARTICLE_CONFIG.BASE_SIZE_RATIO;
          const oscillationAmount = PARTICLE_CONFIG.SIZE_OSCILLATION_AMOUNT;
          const dynamicSizeRatio =
            baseSizeRatio + sizeOscillation * oscillationAmount;
          const dynamicSize = size * dynamicSizeRatio;

          p.fill(circle.color);
          p.noStroke();
          p.circle(circle.x, circle.y, dynamicSize);
        });
      };
    };

    // Create p5 instance only once
    p5Instance.current = new p5(sketch, containerRef.current);

    // Cleanup function
    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
    };
  }, [size]); // Include size in dependencies since it affects canvas creation

  return (
    <div
      className={`rounded-full transition-transform ${
        ANIMATION_CONFIG.TRANSITION_DURATION
      } ${ANIMATION_CONFIG.EASING} contrast-75 ${
        overflow === "hidden" ? " overflow-hidden" : "overflow-visible"
      }`}
      style={{
        width: size,
        height: size,
        transform: `scale(${scale})`,
      }}
    >
      <div
        className={`rounded-full contrast-200 blur-md ${
          overflow === "hidden" ? "overflow-hidden" : "overflow-visible"
        }`}
        style={{ width: size, height: size }}
      >
        <div className="blur-xl">
          <div ref={containerRef} style={{ width: size, height: size }} />
        </div>
      </div>
    </div>
  );
};
