import React, { useRef, useState, useCallback } from 'react';

interface Avatar3DProps {
  letter?: string;
  className?: string;
  size?: number;
}

export const Avatar3D: React.FC<Avatar3DProps> = ({
  letter = 'U',
  className = '',
  size = 64,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, shineX: 50, shineY: 50, isHovered: false });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normalizedX = (x / rect.width) * 2 - 1; // -1 to 1
    const normalizedY = (y / rect.height) * 2 - 1; // -1 to 1

    // Maximum tilt angles in degrees
    const maxTilt = 22;
    const rotateY = normalizedX * maxTilt;
    const rotateX = -normalizedY * maxTilt;

    // Glare / shine hotspot percentage
    const shineX = Math.round((x / rect.width) * 100);
    const shineY = Math.round((y / rect.height) * 100);

    setTilt({
      rotateX,
      rotateY,
      shineX,
      shineY,
      isHovered: true,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      shineX: 50,
      shineY: 50,
      isHovered: false,
    });
  }, []);

  const displayChar = letter ? letter.charAt(0).toUpperCase() : '?';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative select-none cursor-pointer ${className}`}
      style={{
        width: size,
        height: size,
        perspective: 800,
      }}
      aria-label={`Avatar for ${displayChar}`}
      role="img"
    >
      {/* 3D rotating disc container */}
      <div
        className="w-full h-full rounded-full relative flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) ${tilt.isHovered ? 'scale3d(1.08, 1.08, 1.08)' : 'scale3d(1, 1, 1)'}`,
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 45%, #0f172a 100%)',
          boxShadow: tilt.isHovered
            ? `
                ${-tilt.rotateY * 0.8}px ${tilt.rotateX * 0.8 + 8}px 24px rgba(37, 99, 235, 0.45),
                0 10px 25px -5px rgba(0, 0, 0, 0.35),
                inset 0 1px 2px rgba(255, 255, 255, 0.5),
                inset 0 -2px 4px rgba(0, 0, 0, 0.6)
              `
            : `
                0 8px 20px -4px rgba(15, 23, 42, 0.3),
                0 4px 6px -2px rgba(0, 0, 0, 0.1),
                inset 0 1px 2px rgba(255, 255, 255, 0.4),
                inset 0 -2px 4px rgba(0, 0, 0, 0.5)
              `,
        }}
      >
        {/* Subtle metallic rim border */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            boxShadow: 'inset 0 0 10px rgba(255, 255, 255, 0.15)',
          }}
        />

        {/* Dynamic shining glare overlay following cursor position */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300"
          style={{
            opacity: tilt.isHovered ? 0.95 : 0.4,
            background: `radial-gradient(circle at ${tilt.shineX}% ${tilt.shineY}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 28%, rgba(255,255,255,0) 65%)`,
            mixBlendMode: 'overlay',
          }}
        />

        {/* Glass reflection beam */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
          style={{
            background: 'linear-gradient(105deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0) 70%)',
          }}
        />

        {/* 3D Bold Letter popping forward */}
        <span
          className="relative font-extrabold font-display leading-none select-none tracking-tight pointer-events-none"
          style={{
            fontSize: size * 0.46,
            transform: 'translateZ(26px)',
            color: '#f8fafc',
            textShadow: `
              0 1px 0 #93c5fd,
              0 2px 0 #60a5fa,
              0 3px 0 #2563eb,
              0 4px 0 #1d4ed8,
              0 5px 0 #1e40af,
              0 7px 12px rgba(0, 0, 0, 0.6)
            `,
            filter: tilt.isHovered ? 'drop-shadow(0 0 8px rgba(191, 219, 254, 0.75))' : 'drop-shadow(0 0 2px rgba(191, 219, 254, 0.3))',
            transition: 'filter 0.2s ease-out',
          }}
        >
          {displayChar}
        </span>
      </div>
    </div>
  );
};
