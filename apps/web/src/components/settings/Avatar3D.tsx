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
  const [tilt, setTilt] = useState({
    rotateX: 0,
    rotateY: 0,
    shineX: 50,
    shineY: 50,
    isHovered: false,
  });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normalizedX = (x / rect.width) * 2 - 1; // -1 to 1
    const normalizedY = (y / rect.height) * 2 - 1; // -1 to 1

    // Tilt angles for the 3D letter
    const maxTilt = 26;
    const rotateY = normalizedX * maxTilt;
    const rotateX = -normalizedY * maxTilt;

    // Direct cursor coordinates as percentage across the avatar for dynamic shine
    const shineX = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const shineY = Math.max(0, Math.min(100, (y / rect.height) * 100));

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

  // Compute 3D extruded bevel shadows based on tilt direction to create dynamic real 3D letter depth
  const dx = -tilt.rotateY / 14;
  const dy = tilt.rotateX / 14;

  const textShadowHover = `
    ${dx * 1}px ${dy * 1}px 0 rgb(var(--on-surface) / 0.7),
    ${dx * 2}px ${dy * 2}px 0 rgb(var(--on-surface) / 0.5),
    ${dx * 3}px ${dy * 3}px 0 rgb(var(--on-surface) / 0.35),
    ${dx * 4}px ${dy * 4}px 0 rgb(var(--on-surface) / 0.2),
    ${dx * 5 + 1}px ${dy * 5 + 3}px 8px rgb(var(--on-surface) / 0.25)
  `;

  const textShadowIdle = `
    0 1px 0 rgb(var(--on-surface) / 0.5),
    0 2px 0 rgb(var(--on-surface) / 0.3),
    0 3px 0 rgb(var(--on-surface) / 0.15),
    0 4px 6px rgb(var(--on-surface) / 0.18)
  `;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`rounded-full bg-primary-container flex items-center justify-center relative overflow-hidden select-none cursor-pointer border border-outline-variant/20 shadow-sm transition-colors duration-200 ${className}`}
      style={{
        width: size,
        height: size,
        perspective: 600,
      }}
      aria-label={`Avatar for ${displayChar}`}
      role="img"
    >
      {/* 3D Bold Letter with cursor-reactive tilt, extruded bevel depth, and smooth spring-like transitions */}
      <span
        className="font-black font-display leading-none select-none tracking-tight pointer-events-none text-on-primary-container"
        style={{
          fontSize: size * 0.52,
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) ${tilt.isHovered ? 'scale(1.14)' : 'scale(1)'}`,
          transformStyle: 'preserve-3d',
          transition: tilt.isHovered
            ? 'transform 0.18s cubic-bezier(0.25, 1, 0.5, 1), text-shadow 0.18s ease-out, filter 0.25s ease-out'
            : 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), text-shadow 0.45s ease-out, filter 0.35s ease-out',
          textShadow: tilt.isHovered ? textShadowHover : textShadowIdle,
          filter: tilt.isHovered
            ? 'drop-shadow(0 0 6px rgb(var(--on-primary-container) / 0.45))'
            : 'drop-shadow(0 0 1px rgb(var(--on-primary-container) / 0.2))',
        }}
      >
        {displayChar}
      </span>

      {/* Shining highlight whose position directly follows the cursor over the letter, visible in both light & dark themes */}
      <div
        className="absolute inset-0 pointer-events-none rounded-full"
        style={{
          opacity: tilt.isHovered ? 1 : 0,
          background: `radial-gradient(circle 38px at ${tilt.shineX}% ${tilt.shineY}%, rgb(255 255 255 / 0.4) 0%, rgb(var(--on-primary-container) / 0.15) 45%, transparent 75%)`,
          mixBlendMode: 'overlay',
          transition: tilt.isHovered
            ? 'opacity 0.25s ease-out'
            : 'opacity 0.45s ease-out',
        }}
      />
    </div>
  );
};
