import React from 'react';

interface CrownIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  fillColor?: string;
}

export function CrownIcon({ className = "w-7 h-7", fillColor: _fillColor, ...props }: CrownIconProps) {
  return (
    <img
      src="/images/kingstream-logo.png"
      alt="KingStream 18+"
      className={`object-contain select-none ${className}`}
      {...props}
    />
  );
}
