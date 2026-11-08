import React from 'react';

interface CrownIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  fillColor?: string;
}

export function CrownIcon({ className = "w-5 h-5", fillColor = "currentColor", ...props }: CrownIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* 3-Point / 5-Peak Classic Crown matching KingStream brand */}
      <path
        d="M4 17L2.5 8.5L7.5 12L12 5.5L16.5 12L21.5 8.5L20 17H4Z"
        fill={fillColor}
      />
      <rect
        x="4"
        y="18.5"
        width="16"
        height="2"
        rx="0.5"
        fill={fillColor}
      />
    </svg>
  );
}

