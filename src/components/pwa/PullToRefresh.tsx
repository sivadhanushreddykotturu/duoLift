// src/components/pwa/PullToRefresh.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, disabled = false, children }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);

  const THRESHOLD = 64;
  const MAX_PULL = 100;

  useEffect(() => {
    if (disabled) {
      setPullY(0);
      isDraggingRef.current = false;
      return;
    }

    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (disabled || isRefreshing) {
        isDraggingRef.current = false;
        return;
      }

      // Check if touch originated inside an input, form, or modal
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = target.closest("input, textarea, select, button, form, .modal-open, [role='dialog']");
        if (isInteractive) {
          isDraggingRef.current = false;
          return;
        }
      }

      // Only initiate pull-to-refresh if user is at the very top of the window
      if (window.scrollY <= 2) {
        startY = e.touches[0].clientY;
        startYRef.current = startY;
        isDraggingRef.current = true;
      } else {
        isDraggingRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || isRefreshing || disabled) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      // Only pull if swiping down from the very top
      if (diff > 0 && window.scrollY <= 2) {
        // Damped rubber-banding resistance
        const damped = Math.min(MAX_PULL, diff * 0.45);
        setPullY(damped);
      } else {
        setPullY(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isDraggingRef.current || disabled) return;
      isDraggingRef.current = false;

      if (pullY >= THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullY(THRESHOLD * 0.75); // Hold during refresh
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate(20);
          } catch {
            // ignore
          }
        }

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullY(0);
        }
      } else {
        setPullY(0);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullY, isRefreshing, onRefresh, disabled]);

  return (
    <div className="relative w-full">
      {/* Pull Indicator Pill */}
      {(pullY > 0 || isRefreshing) && !disabled && (
        <div
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-150 flex items-center justify-center"
          style={{
            transform: `translate(-50%, ${Math.min(pullY * 0.8, 48)}px)`,
            opacity: Math.min(1, pullY / 30),
          }}
        >
          <div className="bg-black/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium tracking-tight border border-white/10">
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRefreshing ? "animate-spin" : ""
              }`}
              style={{
                transform: !isRefreshing ? `rotate(${pullY * 4}deg)` : undefined,
                transition: isRefreshing ? "none" : "transform 0.1s linear",
              }}
            />
            <span>
              {isRefreshing
                ? "Updating..."
                : pullY >= THRESHOLD
                ? "Release to refresh"
                : "Pull to refresh"}
            </span>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

export default PullToRefresh;
