import { useEffect, useRef, useState } from "react";

interface UseWakeLockOptions {
  enabled: boolean;
  reacquireOnVisibilityChange?: boolean;
}

export function useWakeLock({
  enabled,
  reacquireOnVisibilityChange = true,
}: UseWakeLockOptions) {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Check for wake lock support
  useEffect(() => {
    if ("wakeLock" in navigator) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      setError("Wake lock is not supported by this browser");
    }
  }, []);

  // Request wake lock function
  const requestWakeLock = async () => {
    if (!isSupported) return;

    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      setIsActive(true);
      setError(null);

      // Listen for release event
      wakeLockRef.current.addEventListener("release", () => {
        setIsActive(false);
      });
    } catch (err) {
      setIsActive(false);
      if (err instanceof Error) {
        setError(`${err.name}: ${err.message}`);
      } else {
        setError("Failed to acquire wake lock");
      }
    }
  };

  // Release wake lock function
  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          setError(`Failed to release wake lock: ${err.message}`);
        }
      }
    }
  };

  // Handle visibility change to reacquire wake lock when page becomes visible
  useEffect(() => {
    if (!reacquireOnVisibilityChange || !isSupported) return;

    const handleVisibilityChange = () => {
      if (
        wakeLockRef.current !== null &&
        document.visibilityState === "visible" &&
        enabled
      ) {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, reacquireOnVisibilityChange, isSupported]);

  // Main effect to manage wake lock based on enabled state
  useEffect(() => {
    if (!isSupported) return;

    if (enabled && !isActive && !wakeLockRef.current) {
      requestWakeLock();
    } else if (!enabled && wakeLockRef.current) {
      releaseWakeLock();
    }
  }, [enabled, isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  return {
    isSupported,
    isActive,
    error,
    requestWakeLock,
    releaseWakeLock,
  };
}
