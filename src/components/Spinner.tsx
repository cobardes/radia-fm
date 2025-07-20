import React from "react";

interface SpinnerProps {
  /** Size of the spinner (width and height) */
  size?: number | string;
  /** Color of the spinner stroke */
  color?: string;
  /** Stroke width of the spinner */
  strokeWidth?: number;
  /** Additional CSS classes */
  className?: string;
  /** Animation duration in seconds */
  duration?: number;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 24,
  color = "black",
  strokeWidth = 3,
  className = "",
  duration = 1.5,
}) => {
  const rotationDuration = duration * 1.33; // Slightly longer rotation for visual appeal

  return (
    <svg
      stroke={color}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
    >
      <g>
        <circle
          cx="12"
          cy="12"
          r="9.5"
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        >
          <animate
            attributeName="stroke-dasharray"
            dur={`${duration}s`}
            calcMode="spline"
            values="0 150;42 150;42 150;42 150"
            keyTimes="0;0.475;0.95;1"
            keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-dashoffset"
            dur={`${duration}s`}
            calcMode="spline"
            values="0;-16;-59;-59"
            keyTimes="0;0.475;0.95;1"
            keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
            repeatCount="indefinite"
          />
        </circle>
        <animateTransform
          attributeName="transform"
          type="rotate"
          dur={`${rotationDuration}s`}
          values="0 12 12;360 12 12"
          repeatCount="indefinite"
        />
      </g>
    </svg>
  );
};

export default Spinner;
