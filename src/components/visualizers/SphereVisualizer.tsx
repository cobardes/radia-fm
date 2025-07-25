"use client";

import p5 from "p5";
import { useEffect, useRef } from "react";

const SIZE = 200;

// Animation constants
const ANIMATION_CONFIG = {
  TRANSITION_DURATION: "100ms", // Tailwind duration class
  EASING: "ease-out", // CSS easing function
} as const;

// Particle animation constants
const PARTICLE_CONFIG = {
  ORBIT_RADIUS_RATIO: 0.3, // Orbit radius as a ratio of canvas size
  BASE_SIZE_RATIO: 0.7, // Base size of particles as a ratio of canvas size
  SIZE_OSCILLATION_AMOUNT: 0.1, // How much the size varies (±40%)
  SIZE_FREQUENCY_BASE: 0.08, // Base frequency for size oscillation
  SIZE_FREQUENCY_VARIATION: 0.03, // Frequency variation between particles
  ELLIPSE_RATIO_BASE: 1.0, // Base width/height ratio for ellipses
  ELLIPSE_RATIO_VARIATION: 0.6, // How much the ellipse ratio varies
  ELLIPSE_FREQUENCY_BASE: 0.5, // Base frequency for ellipse shape changes
  ELLIPSE_FREQUENCY_VARIATION: 0.05, // Frequency variation for ellipse changes
} as const;

type SphereVisualizerProps = {
  colors?: string[];
  speed?: number;
  scale?: number;
  goBlack?: boolean;
};

export const SphereVisualizer = ({
  goBlack = false,
  scale = 1,
  colors = ["#3b82f6"],
  speed = 1,
}: SphereVisualizerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const propsRef = useRef({ colors, speed });

  // Update props ref when props change (without recreating sketch)
  useEffect(() => {
    propsRef.current = { colors, speed };
  }, [colors, speed]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let accumulatedTime = 0; // Track time independently of speed changes

      p.setup = () => {
        p.createCanvas(SIZE, SIZE); // 2D canvas instead of WEBGL
      };

      p.draw = () => {
        const { colors, speed } = propsRef.current;

        // Accumulate time based on current speed (instead of using frameCount)
        accumulatedTime += 0.015 * speed;

        // Set background
        p.clear();

        // Center coordinates
        const centerX = SIZE / 2;
        const centerY = SIZE / 2;

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
          const radius = SIZE * PARTICLE_CONFIG.ORBIT_RADIUS_RATIO;

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
          const colorCycleSpeed = 0.05;
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

        circleColor.setAlpha(1 * 255);
        p.fill(circleColor);
        p.noStroke();

        // Draw the main circle at center
        p.circle(centerX, centerY, SIZE); // Main circle diameter equals canvas size

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
          const dynamicSize = SIZE * dynamicSizeRatio;

          // Calculate ellipse shape changes
          const ellipseFreq =
            PARTICLE_CONFIG.ELLIPSE_FREQUENCY_BASE +
            index * PARTICLE_CONFIG.ELLIPSE_FREQUENCY_VARIATION;
          const ellipsePhase = (index * p.PI * 1.3) / colors.length; // Different phase for shape
          const ellipseOscillation = p.sin(
            accumulatedTime * ellipseFreq + ellipsePhase
          );

          // Calculate width and height ratios for ellipse
          const baseRatio = PARTICLE_CONFIG.ELLIPSE_RATIO_BASE;
          const ratioVariation = PARTICLE_CONFIG.ELLIPSE_RATIO_VARIATION;
          const widthRatio = baseRatio + ellipseOscillation * ratioVariation;
          const heightRatio =
            baseRatio - ellipseOscillation * ratioVariation * 0.7; // Different variation for height

          const ellipseWidth = dynamicSize * widthRatio;
          const ellipseHeight = dynamicSize * heightRatio;

          // Draw main particle ellipse
          const mainColor = p.color(circle.color);
          mainColor.setAlpha(1 * 255);
          p.fill(mainColor);
          p.noStroke();
          p.ellipse(circle.x, circle.y, ellipseWidth, ellipseHeight);
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
  }, []); // No dependencies needed since size is now constant

  return (
    <div
      id="sphere-visualizer"
      className={`rounded-full bg-transparent transition-transform overflow-hidden`}
      style={{
        width: SIZE,
        height: SIZE,
        transform: `scale(${scale})`,
        transitionDuration: ANIMATION_CONFIG.TRANSITION_DURATION,
        transitionTimingFunction: ANIMATION_CONFIG.EASING,
        backgroundColor: goBlack ? "#000" : "transparent",
      }}
    >
      <div className={`rounded-full`} style={{ width: SIZE, height: SIZE }}>
        <div className="blur-lg contrast-[3] ">
          <div className="saturate-150">
            <div ref={containerRef} style={{ width: SIZE, height: SIZE }} />
          </div>
        </div>
      </div>
      <div
        className="absolute inset-0 rounded-full box-border transition-opacity duration-200"
        style={{
          boxShadow: goBlack
            ? [
                "inset 0 0 3px 2px rgba(0, 0, 0, .5)",
                "inset 0 0 30px 50px rgba(0, 0, 0, .5)",
              ].join(", ")
            : [
                "inset 0 0 2px 2px rgba(0, 0, 0, .05)",
                "inset 0 -20px 20px 5px rgba(0, 0, 0, .1)",
                "inset 0 40px 80px 50px rgba(255, 255, 255, .4)",
              ].join(", "),
        }}
      />
    </div>
  );
};
