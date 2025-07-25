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
  ORBIT_RADIUS_RATIO: 0.15, // Smaller orbit radius - closer to center
  BASE_SIZE_RATIO: 1.3, // Larger base size
  SIZE_OSCILLATION_AMOUNT: 0.1, // How much the size varies (±40%)
  SIZE_FREQUENCY_BASE: 0.08, // Base frequency for size oscillation
  SIZE_FREQUENCY_VARIATION: 0.03, // Frequency variation between particles
  ELLIPSE_RATIO_BASE: 1.0, // Base width/height ratio for ellipses
  ELLIPSE_RATIO_VARIATION: 0.25, // Reduced for more circular shapes (was 0.6)
  ELLIPSE_FREQUENCY_BASE: 0.5, // Base frequency for ellipse shape changes
  ELLIPSE_FREQUENCY_VARIATION: 0.05, // Frequency variation for ellipse changes
  Z_BASE_DISTANCE: 80, // Base distance from main sphere towards camera
  Z_ANIMATION_RANGE: 15, // Small range of Z movement (±15)
  Z_ANIMATION_FREQUENCY: 0.2, // How fast spheres move through z-space
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
        p.createCanvas(SIZE, SIZE, p.WEBGL); // 3D canvas with WEBGL

        // Set up orthographic projection for no perspective (looks 2D) - closer camera
        p.ortho(-SIZE / 4, SIZE / 4, -SIZE / 4, SIZE / 4, -200, 200);

        // Set initial camera position closer to the scene
        p.camera(0, 0, 100, 0, 0, 0, 0, 1, 0);
      };

      p.draw = () => {
        const { colors, speed } = propsRef.current;

        // Accumulate time based on current speed (instead of using frameCount)
        accumulatedTime += 0.015 * speed;

        // Set background
        p.clear();

        // Enable mouse drag for debugging
        p.orbitControl();

        // Store sphere positions and properties for visualization
        const sphereData: {
          x: number;
          y: number;
          z: number;
          color: string;
          index: number;
          scaleX: number;
          scaleY: number;
          scaleZ: number;
        }[] = [];

        // Create multiple moving colored spheres from dominant colors - use accumulated time
        const time = accumulatedTime;

        colors.forEach((color, index) => {
          // Different frequencies and phase offsets for each sphere (more circular)
          const freqX = 1.0 + index * 0.1; // Subtle frequency variations for near-circular motion
          const freqY = 1.0 + index * 0.12;

          // Create randomized initial phase offsets (consistent per sphere)
          const randomSeedX = Math.sin(index * 12.345) * 1000; // Pseudo-random seed for X
          const randomSeedY = Math.sin(index * 67.89) * 1000; // Pseudo-random seed for Y
          const randomPhaseX =
            (randomSeedX - Math.floor(randomSeedX)) * p.PI * 2; // Random 0-2π
          const randomPhaseY =
            (randomSeedY - Math.floor(randomSeedY)) * p.PI * 2; // Random 0-2π

          const basePhaseOffset = (index * p.PI * 2) / colors.length; // Even distribution
          const finalPhaseX = basePhaseOffset + randomPhaseX; // Add randomness
          const finalPhaseY = basePhaseOffset + randomPhaseY; // Add randomness

          // Position spheres around the center with gentle movement
          const radius = SIZE * PARTICLE_CONFIG.ORBIT_RADIUS_RATIO;

          // Note: WEBGL mode has (0,0) at center, so no need to add SIZE/2
          const sphereX = p.cos(time * freqX + finalPhaseX) * radius;
          const sphereY = p.sin(time * freqY + finalPhaseY) * radius;

          // Calculate z-position - ALWAYS in front of main sphere, closer to camera
          const zFreq = PARTICLE_CONFIG.Z_ANIMATION_FREQUENCY + index * 0.05;
          const zPhase = (index * p.PI * 1.7) / colors.length; // Different phase for z-movement
          const randomZPhase = finalPhaseX * 0.3 + finalPhaseY * 0.7; // Mix XY randomness for Z

          // Position spheres much closer to camera with minimal Z variation
          const zBase = PARTICLE_CONFIG.Z_BASE_DISTANCE; // Base distance towards camera
          const zVariation =
            p.sin(accumulatedTime * zFreq + zPhase + randomZPhase) *
            PARTICLE_CONFIG.Z_ANIMATION_RANGE;
          const sphereZ = zBase + zVariation; // Always positive, close to camera

          // Calculate dynamic size with smooth growing/shrinking animation
          const sizeFreq =
            PARTICLE_CONFIG.SIZE_FREQUENCY_BASE +
            index * PARTICLE_CONFIG.SIZE_FREQUENCY_VARIATION;
          const sizePhase = (index * p.PI) / colors.length + randomPhaseX * 0.5; // Add randomness to size phase
          const sizeOscillation = p.sin(accumulatedTime * sizeFreq + sizePhase);

          // Base size with oscillation - made smaller and more reasonable
          const baseSizeRatio = PARTICLE_CONFIG.BASE_SIZE_RATIO * 0.6; // Larger overall
          const oscillationAmount = PARTICLE_CONFIG.SIZE_OSCILLATION_AMOUNT;
          const dynamicSizeRatio =
            baseSizeRatio + sizeOscillation * oscillationAmount;
          const dynamicSize = SIZE * dynamicSizeRatio;

          // Calculate ellipsoid shape changes (scaling in different dimensions)
          const ellipseFreq =
            PARTICLE_CONFIG.ELLIPSE_FREQUENCY_BASE +
            index * PARTICLE_CONFIG.ELLIPSE_FREQUENCY_VARIATION;
          const ellipsePhase =
            (index * p.PI * 1.3) / colors.length + randomPhaseY * 0.4; // Add randomness to ellipse phase
          const ellipseOscillation = p.sin(
            accumulatedTime * ellipseFreq + ellipsePhase
          );

          // Calculate scale ratios for ellipsoid
          const baseRatio = PARTICLE_CONFIG.ELLIPSE_RATIO_BASE;
          const ratioVariation = PARTICLE_CONFIG.ELLIPSE_RATIO_VARIATION;
          const scaleX = baseRatio + ellipseOscillation * ratioVariation;
          const scaleY = baseRatio - ellipseOscillation * ratioVariation * 0.7;
          const scaleZ = baseRatio + ellipseOscillation * ratioVariation * 0.4; // Z-scale variation

          // Store all data for later rendering
          sphereData.push({
            x: sphereX,
            y: sphereY,
            z: sphereZ,
            color,
            index,
            scaleX: scaleX * dynamicSize,
            scaleY: scaleY * dynamicSize,
            scaleZ: scaleZ * dynamicSize,
          });
        });

        // Sort spheres by z-position for proper depth ordering (front to back for transparency)
        sphereData.sort((a, b) => b.z - a.z);

        // Draw the main sphere at center (always at z=0, behind the particles)
        p.push();

        // Set fill color - animate through all dominant colors
        let sphereColor;
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
          sphereColor = p.lerpColor(currentColor, nextColor, lerpAmount);
        } else {
          sphereColor = p.color(colors[0] || "#fff");
        }

        p.fill(sphereColor);
        p.noStroke();

        // Draw the main sphere at center (z=0) - background sphere
        p.translate(0, 0, 0);
        p.sphere(SIZE / 3); // Reasonable main sphere size
        p.pop();

        // Draw colored particle spheres in depth order (front to back)
        sphereData.forEach((sphere) => {
          p.push();

          // Set position
          p.translate(sphere.x, sphere.y, sphere.z);

          // Apply non-uniform scaling for ellipsoid effect - restored
          p.scale(
            sphere.scaleX / (SIZE * 1.5),
            sphere.scaleY / (SIZE * 1.5),
            sphere.scaleZ / (SIZE * 1.5)
          );

          // Set color
          const mainColor = p.color(sphere.color);
          p.fill(mainColor);
          p.noStroke();

          // Draw ellipsoid (scaled sphere)
          p.sphere(SIZE / 3);

          p.pop();
        });

        // Debug info - draw axes for reference (smaller)
        p.push();
        p.strokeWeight(1);

        // X axis - red
        p.stroke(255, 0, 0);
        p.line(-SIZE / 4, 0, 0, SIZE / 4, 0, 0);

        // Y axis - green
        p.stroke(0, 255, 0);
        p.line(0, -SIZE / 4, 0, 0, SIZE / 4, 0);

        // Z axis - blue
        p.stroke(0, 0, 255);
        p.line(0, 0, 0, 0, 0, SIZE / 4);

        p.pop();
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
        <div className="contrast-[2.5]">
          <div className="blur-lg">
            <div ref={containerRef} style={{ width: SIZE, height: SIZE }} />
          </div>
        </div>
      </div>
      <div
        className="absolute inset-0 rounded-full box-border transition-opacity duration-200"
        style={{
          boxShadow: goBlack
            ? [
                "inset 0 0 3px 2px rgba(0, 0, 0, 1)",
                "inset 0 0 30px 50px rgba(0, 0, 0, .5)",
              ].join(", ")
            : [
                "inset 0 0 2px 2px rgba(0, 0, 0, .05)",
                "inset 0 -20px 20px 5px rgba(0, 0, 0, .1)",
                "inset 0 20px 40px 40px rgba(255, 255, 255, .2)",
              ].join(", "),
        }}
      />
    </div>
  );
};
