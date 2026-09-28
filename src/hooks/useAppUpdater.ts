// src/hooks/useAppUpdater.ts
"use client";

import { useEffect, useRef, useCallback } from "react";

// Injected by next.config.ts at build time
const CURRENT_BUILD_ID = process.env.NEXT_PUBLIC_APP_BUILD_ID || "dev";

export function useAppUpdater() {
  const isCheckingRef = useRef(false);
  const isUpdatingRef = useRef(false);

  const checkForAppUpdate = useCallback(async (isManual = false) => {
    if (isCheckingRef.current || isUpdatingRef.current) return false;
    if (process.env.NODE_ENV === "development" && CURRENT_BUILD_ID === "dev" && !isManual) return false;

    try {
      isCheckingRef.current = true;

      // Force network-only fetch with timestamp to bypass iOS/Android disk cache
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          Pragma: "no-cache",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (!res.ok) return false;
      const serverVersion = await res.json();

      // If server buildId differs from running buildId
      if (serverVersion && serverVersion.buildId && serverVersion.buildId !== CURRENT_BUILD_ID) {
        console.log(`[PWA Update] New version detected (Server: ${serverVersion.buildId} vs App: ${CURRENT_BUILD_ID})`);
        isUpdatingRef.current = true;

        // Request Service Worker to update and skip waiting
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.update();
            if (registration.waiting) {
              registration.waiting.postMessage({ type: "SKIP_WAITING" });
            }
          }
        }

        // Clean up old CacheStorage code buckets (leaves localStorage/cookies intact)
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }

        // Clean reload to new code
        window.location.reload();
        return true;
      } else {
        // If version matches, still trigger background SW update check
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) reg.update();
        }
      }
    } catch {
      // Network offline or failed - ignore silently
    } finally {
      isCheckingRef.current = false;
    }
    return false;
  }, []);

  useEffect(() => {
    // 1. Cold Start Check
    checkForAppUpdate();

    // 2. Resume / App Switcher / Visibility Listeners (Crucial for iOS & Android)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForAppUpdate();
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      // iOS Safari fires pageshow when restored from frozen state (e.persisted)
      if (e.persisted || document.visibilityState === "visible") {
        checkForAppUpdate();
      }
    };

    const handleFocus = () => {
      checkForAppUpdate();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleFocus);

    // 3. Periodic background polling every 5 minutes for active sessions
    const interval = setInterval(() => checkForAppUpdate(), 5 * 60 * 1000);

    // 4. Handle Service Worker controller change (skipWaiting activation)
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing && isUpdatingRef.current) {
        refreshing = true;
        window.location.reload();
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      }
    };
  }, [checkForAppUpdate]);

  return { checkForAppUpdate, currentBuildId: CURRENT_BUILD_ID };
}

export default useAppUpdater;
