import { useEffect, useRef } from "react";

interface PulseVisualizerProps {
  averageFrequency: number;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const PulseVisualizer = ({
  averageFrequency,
  size = 60,
  color = "#3b82f6",
  backgroundColor = "transparent",
}: PulseVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;

    // Calculate pulse radius based on frequency (0-255 -> minRadius to maxRadius)
    const minRadius = size * 0.2;
    const maxRadius = size * 0.45;
    const normalizedFreq = averageFrequency / 255;
    // Apply power curve for more dramatic visual changes
    const enhancedFreq = Math.pow(normalizedFreq, 0.7);
    const pulseRadius = minRadius + enhancedFreq * (maxRadius - minRadius);

    // Clear canvas completely
    ctx.clearRect(0, 0, size, size);

    // Fill background if not transparent
    if (backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, size, size);
    }

    // Draw pulsing circle with gradient
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      pulseRadius
    );

    // Make the gradient more intense based on frequency
    const intensity = Math.min(enhancedFreq * 1.5, 1);
    gradient.addColorStop(0, color);
    gradient.addColorStop(
      0.6,
      `${color}${Math.floor(intensity * 180)
        .toString(16)
        .padStart(2, "0")}`
    );
    gradient.addColorStop(1, "transparent");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw inner core
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, minRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }, [averageFrequency, size, color, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-full"
    />
  );
};
