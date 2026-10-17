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
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, isHovered: false });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normalizedX = (x / rect.width) * 2 - 1; // -1 to 1
    const normalizedY = (y / rect.height) * 2 - 1; // -1 to 1

    // Tilt angles for the 3D letter
    const maxTilt = 28;
    const rotateY = normalizedX * maxTilt;
    const rotateX = -normalizedY * maxTilt;

    setTilt({
      rotateX,
      rotateY,
      isHovered: true,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      isHovered: false,
    });
  }, []);

  const displayChar = letter ? letter.charAt(0).toUpperCase() : '?';

  // Compute 3D extruded bevel shadows based on tilt direction to create dynamic real 3D letter depth
  const dx = -tilt.rotateY / 14;
  const dy = tilt.rotateX / 14;

  const textShadow3D = `
    ${dx * 1}px ${dy * 1}px 0 rgb(var(--primary) / 0.75),
    ${dx * 2}px ${dy * 2}px 0 rgb(var(--primary) / 0.6),
    ${dx * 3}px ${dy * 3}px 0 rgb(var(--primary) / 0.45),
    ${dx * 4}px ${dy * 4}px 0 rgb(var(--primary) / 0.3),
    ${dx * 5 + 1}px ${dy * 5 + 3}px 8px rgb(0 0 0 / 0.35)
  `;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`rounded-full bg-primary-container flex items-center justify-center relative overflow-hidden select-none cursor-pointer border border-outline-variant/15 ${className}`}
      style={{
        width: size,
        height: size,
        perspective: 600,
      }}
      aria-label={`Avatar for ${displayChar}`}
      role="img"
    >
      {/* 3D Bold Letter with cursor-reactive tilt, 3D extruded depth and theme-based metallic sheen */}
      <span
        className="font-black font-display leading-none select-none tracking-tight pointer-events-none transition-transform duration-150 ease-out"
        style={{
          fontSize: size * 0.52,
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) ${tilt.isHovered ? 'scale(1.14)' : 'scale(1)'}`,
          transformStyle: 'preserve-3d',
          color: 'rgb(var(--on-primary-container))',
          textShadow: tilt.isHovered
            ? textShadow3D
            : `
                0 1px 0 rgb(var(--primary) / 0.7),
                0 2px 0 rgb(var(--primary) / 0.5),
                0 3px 0 rgb(var(--primary) / 0.3),
                0 4px 6px rgb(0 0 0 / 0.25)
              `,
          filter: tilt.isHovered
            ? 'drop-shadow(0 0 6px rgb(var(--on-primary-container) / 0.5))'
            : 'drop-shadow(0 0 1px rgb(var(--on-primary-container) / 0.2))',
        }}
      >
        {displayChar}
      </span>

      {/* Shining light beam sweeping across the letter on hover */}
      <div
        className="absolute inset-0 pointer-events-none rounded-full"
        style={{
          background: 'linear-gradient(120deg, transparent 20%, rgb(255 255 255 / 0.18) 50%, transparent 80%)',
          transform: tilt.isHovered ? 'translateX(100%)' : 'translateX(-100%)',
          transition: 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </div>
  );
};
