import { useEffect, useState } from 'react';

/**
 * Detects a touch device with a camera, so capture UI is only offered
 * where the OS can actually open one (phones/tablets, not desktops).
 */
export function useDeviceCamera(): boolean {
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
    if (!isCoarsePointer || !navigator.mediaDevices?.enumerateDevices) return;

    let cancelled = false;
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        if (!cancelled) {
          setHasCamera(devices.some((device) => device.kind === 'videoinput'));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return hasCamera;
}
