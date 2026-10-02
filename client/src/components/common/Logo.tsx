import React from 'react';

interface LogoProps {
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
  badge?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = false,
  textClassName = 'text-white font-extrabold tracking-tight',
  badge,
  className = '',
}) => {
  const getPixelSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'xs':
        return 20;
      case 'sm':
        return 26;
      case 'md':
        return 32;
      case 'lg':
        return 40;
      case 'xl':
        return 52;
      default:
        return 32;
    }
  };

  const pixelSize = getPixelSize();

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Concepto 2: The Pulse & Monolith (SVG Vectorial) */}
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200"
        aria-label="LifeFlow - The Pulse & Monolith Logo"
      >
        <defs>
          {/* Obsidian Monolith Surface */}
          <linearGradient id="monolith-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1C1C20" />
            <stop offset="50%" stopColor="#121215" />
            <stop offset="100%" stopColor="#09090B" />
          </linearGradient>

          {/* Precision Architectural Border */}
          <linearGradient id="monolith-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3F3F46" />
            <stop offset="100%" stopColor="#27272A" />
          </linearGradient>

          {/* Luminous Pulse Gradient */}
          <linearGradient id="pulse-stroke" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#A1A1AA" />
            <stop offset="25%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#D4D4D8" />
          </linearGradient>

          {/* Subtle Glow Filter */}
          <filter id="pulse-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. The Monolith (Squircle Architectural Block) */}
        <rect width="512" height="512" rx="128" fill="#09090B" />
        <rect
          x="20"
          y="20"
          width="472"
          height="472"
          rx="112"
          fill="url(#monolith-grad)"
          stroke="url(#monolith-border)"
          strokeWidth="8"
        />

        {/* 2. Inner Ambient Radiance */}
        <circle cx="256" cy="256" r="160" fill="#FFFFFF" fillOpacity="0.02" />

        {/* 3. The Pulse (Vital Flow / Electrocardiogram Vector) */}
        <path
          d="M 84 256 L 176 256 L 208 200 L 236 332 L 284 136 L 320 312 L 348 240 L 372 256 L 428 256"
          stroke="url(#pulse-stroke)"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#pulse-glow-filter)"
        />

        {/* 4. Vital Energy Spark Node at Apex */}
        <circle cx="284" cy="136" r="13" fill="#FFFFFF" />
        <circle cx="284" cy="136" r="22" fill="#FFFFFF" fillOpacity="0.25" />
      </svg>

      {/* Optional Brand Typography */}
      {showText && (
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-base font-extrabold tracking-tight ${textClassName}`}>
            LifeFlow
          </span>
          {badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#18181B] text-zinc-300 border border-[#27272A]">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
