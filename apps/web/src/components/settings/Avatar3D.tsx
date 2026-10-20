import React, { useRef, useState, useCallback, useEffect } from 'react';
import { triggerAvatarHaptic } from '../../utils/haptics';

interface Avatar3DProps {
  letter?: string;
  className?: string;
  size?: number;
}

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
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

  // Track if gyroscope/accelerometer motion was detected
  const [hasDeviceMotion, setHasDeviceMotion] = useState(false);

  // Click animation states
  const [isAnimatingClick, setIsAnimatingClick] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [pulseWave, setPulseWave] = useState(false);

  // DeviceOrientation (accelerometer/gyroscope) handler for mobile devices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) {
      return;
    }

    let isSubscribed = true;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // If values are null, sensor not available on device
      if (e.gamma === null || e.beta === null) return;

      if (!hasDeviceMotion) {
        setHasDeviceMotion(true);
      }

      // gamma is left-to-right tilt in degrees [-90, 90]
      // beta is front-to-back tilt in degrees [-180, 180]
      // Typical handheld phone holding angle: ~45 degrees beta
      const gamma = Math.max(-45, Math.min(45, e.gamma));
      const beta = Math.max(-45, Math.min(45, e.beta - 45)); // Offset 45deg for natural holding pose

      const maxTilt = 26;
      const rotateY = (gamma / 45) * maxTilt;
      const rotateX = -(beta / 45) * maxTilt;

      // Shine highlights follow tilt opposite to simulate fixed overhead light source
      const shineX = Math.max(0, Math.min(100, 50 + (gamma / 45) * 40));
      const shineY = Math.max(0, Math.min(100, 50 + (beta / 45) * 40));

      if (isSubscribed) {
        setTilt({
          rotateX,
          rotateY,
          shineX,
          shineY,
          isHovered: true,
        });
      }
    };

    // Standard listener for modern mobile browsers
    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      isSubscribed = false;
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [hasDeviceMotion]);

  // Request orientation permission on iOS 13+ upon first user interaction
  const requestOrientationPermission = useCallback(async () => {
    const DeviceOrientationEventAny = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DeviceOrientationEventAny?.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEventAny.requestPermission();
        if (permission === 'granted') {
          setHasDeviceMotion(true);
        }
      } catch {
        // Permission dismissed or not allowed; desktop mouse fallback remains
      }
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // If mobile accelerometer is actively providing motion, ignore mouse pointer
    if (hasDeviceMotion) return;

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
  }, [hasDeviceMotion]);

  const handleMouseLeave = useCallback(() => {
    if (hasDeviceMotion) return;

    setTilt({
      rotateX: 0,
      rotateY: 0,
      shineX: 50,
      shineY: 50,
      isHovered: false,
    });
  }, [hasDeviceMotion]);

  // Extra creative click reaction: 3D barrel spin, shockwave ring, and sparkling particle burst
  const handleClick = useCallback(() => {
    triggerAvatarHaptic();
    requestOrientationPermission();

    setSpinCount((prev) => prev + 1);
    setIsAnimatingClick(true);
    setPulseWave(true);

    // Spawn 8 radial theme-colored particles
    const themeColors = [
      'rgb(var(--primary))',
      'rgb(var(--on-primary-container))',
      'rgb(var(--secondary))',
      'rgb(255 255 255)',
    ];

    const newParticles: Particle[] = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      angle: (i * (360 / 8) + (Math.random() * 20 - 10)) * (Math.PI / 180),
      distance: (size / 2) + 12 + Math.random() * 10,
      size: 3 + Math.random() * 2.5,
      color: themeColors[i % themeColors.length] ?? 'rgb(var(--primary))',
    }));
    setParticles(newParticles);
  }, [requestOrientationPermission, size]);

  useEffect(() => {
    if (!isAnimatingClick) return;
    const timer = setTimeout(() => {
      setIsAnimatingClick(false);
      setPulseWave(false);
      setParticles([]);
    }, 750);
    return () => clearTimeout(timer);
  }, [isAnimatingClick, spinCount]);

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
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`rounded-full bg-primary-container flex items-center justify-center relative select-none cursor-pointer border border-outline-variant/20 shadow-sm transition-colors duration-200 ${className}`}
      style={{
        width: size,
        height: size,
        perspective: 600,
      }}
      aria-label={`Avatar for ${displayChar}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* 3D Bold Letter with cursor or accelerometer-reactive tilt & 360° corkscrew pop on click */}
      <span
        className="font-black font-display leading-none select-none tracking-tight pointer-events-none text-on-primary-container"
        style={{
          fontSize: size * 0.52,
          transform: isAnimatingClick
            ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY + spinCount * 360}deg) scale(1.3) translateZ(32px)`
            : `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY + spinCount * 360}deg) ${tilt.isHovered ? 'scale(1.14)' : 'scale(1)'}`,
          transformStyle: 'preserve-3d',
          transition: isAnimatingClick
            ? 'transform 0.75s cubic-bezier(0.175, 0.885, 0.32, 1.275), text-shadow 0.3s ease-out, filter 0.3s ease-out'
            : hasDeviceMotion
              ? 'transform 0.1s ease-out, text-shadow 0.1s ease-out, filter 0.1s ease-out'
              : tilt.isHovered
                ? 'transform 0.18s cubic-bezier(0.25, 1, 0.5, 1), text-shadow 0.18s ease-out, filter 0.25s ease-out'
                : 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), text-shadow 0.45s ease-out, filter 0.35s ease-out',
          textShadow: tilt.isHovered || isAnimatingClick ? textShadowHover : textShadowIdle,
          filter: isAnimatingClick
            ? 'drop-shadow(0 0 12px rgb(var(--on-primary-container) / 0.85))'
            : tilt.isHovered
              ? 'drop-shadow(0 0 6px rgb(var(--on-primary-container) / 0.45))'
              : 'drop-shadow(0 0 1px rgb(var(--on-primary-container) / 0.2))',
        }}
      >
        {displayChar}
      </span>

      {/* Shining highlight whose position directly follows cursor or mobile tilt */}
      <div
        className="absolute inset-0 pointer-events-none rounded-full overflow-hidden"
        style={{
          opacity: tilt.isHovered || isAnimatingClick ? 1 : 0,
          background: `radial-gradient(circle 38px at ${tilt.shineX}% ${tilt.shineY}%, rgb(255 255 255 / 0.4) 0%, rgb(var(--on-primary-container) / 0.15) 45%, transparent 75%)`,
          mixBlendMode: 'overlay',
          transition: hasDeviceMotion
            ? 'none'
            : tilt.isHovered
              ? 'opacity 0.25s ease-out'
              : 'opacity 0.45s ease-out',
        }}
      />

      {/* Ripple shockwave ring on click */}
      {pulseWave && (
        <span
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -4,
            border: '2px solid rgb(var(--on-primary-container))',
            animation: 'avatar-pulse 0.7s cubic-bezier(0, 0, 0.2, 1) forwards',
          }}
        />
      )}

      {/* Particle sparkle burst */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            '--tx': `${Math.cos(p.angle) * p.distance}px`,
            '--ty': `${Math.sin(p.angle) * p.distance}px`,
            animation: 'avatar-particle 0.65s cubic-bezier(0.25, 1, 0.5, 1) forwards',
          } as React.CSSProperties}
        />
      ))}

      <style>{`
        @keyframes avatar-pulse {
          0% {
            transform: scale(0.9);
            opacity: 0.9;
          }
          100% {
            transform: scale(1.45);
            opacity: 0;
          }
        }
        @keyframes avatar-particle {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          70% {
            opacity: 0.9;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
