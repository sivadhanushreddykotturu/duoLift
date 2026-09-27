"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DuoState, WorkoutLog, ProgressPhotoItem } from "@/lib/types";
import { initialDuoData } from "@/lib/mockData";
import confetti from "canvas-confetti";

interface DuoContextType {
  data: DuoState;
  logWorkout: (workout: Omit<WorkoutLog, "id" | "date" | "userId" | "userName" | "userAvatar">) => void;
  addPhoto: (photo: { imageUrl: string; caption: string; type: "Pump" | "Physique" | "Scale" | "Meal"; bodyWeightKg?: number }) => void;
  sendNudge: (emoji: string, message: string) => void;
  addReaction: (photoId: string, emoji: string) => void;
  triggerPartnerCheckin: () => void;
  hapticFeedback: (pattern?: number | number[]) => void;
}

const DuoContext = createContext<DuoContextType | null>(null);

const STORAGE_KEY = "duolift_state_v1";

export function DuoProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DuoState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved state", e);
        }
      }
    }
    return initialDuoData;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  const hapticFeedback = (pattern: number | number[] = 15) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Safe fallback
      }
    }
  };

  const logWorkout = (workoutInput: Omit<WorkoutLog, "id" | "date" | "userId" | "userName" | "userAvatar">) => {
    hapticFeedback([30, 50, 30]);

    const newWorkout: WorkoutLog = {
      ...workoutInput,
      id: "w_" + Date.now(),
      userId: data.currentUser.id,
      userName: data.currentUser.name,
      userAvatar: data.currentUser.avatar,
      date: new Date().toISOString(),
    };

    setData((prev) => {
      const updatedUser = {
        ...prev.currentUser,
        statusToday: "completed" as const,
        todayWorkoutTitle: newWorkout.title,
        weeklyCompletedDays: Math.min(prev.currentUser.weeklyGoalDays, prev.currentUser.weeklyCompletedDays + 1),
        totalVolumeMonthKg: prev.currentUser.totalVolumeMonthKg + newWorkout.totalVolumeKg,
      };

      // Check if both completed to advance shared streak
      const bothDone = updatedUser.statusToday === "completed" && prev.partner.statusToday === "completed";
      const newStreak = bothDone ? prev.sharedStreak + 1 : prev.sharedStreak;

      if (bothDone) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#CCFF00", "#10B981", "#00D2FF"],
        });
      }

      return {
        ...prev,
        currentUser: updatedUser,
        sharedStreak: newStreak,
        workouts: [newWorkout, ...prev.workouts],
      };
    });
  };

  const addPhoto = (photoInput: { imageUrl: string; caption: string; type: "Pump" | "Physique" | "Scale" | "Meal"; bodyWeightKg?: number }) => {
    hapticFeedback(25);
    const newPhoto: ProgressPhotoItem = {
      id: "p_" + Date.now(),
      userId: data.currentUser.id,
      userName: data.currentUser.name,
      userAvatar: data.currentUser.avatar,
      imageUrl: photoInput.imageUrl,
      caption: photoInput.caption,
      type: photoInput.type,
      bodyWeightKg: photoInput.bodyWeightKg,
      date: new Date().toISOString(),
      reactions: [],
    };

    setData((prev) => ({
      ...prev,
      photos: [newPhoto, ...prev.photos],
    }));
  };

  const sendNudge = (emoji: string, message: string) => {
    hapticFeedback([40, 60, 40]);
    setData((prev) => ({
      ...prev,
      lastNudge: {
        fromName: prev.currentUser.name,
        emoji,
        message,
        time: "Just now",
      },
    }));
  };

  const addReaction = (photoId: string, emoji: string) => {
    hapticFeedback(15);
    setData((prev) => ({
      ...prev,
      photos: prev.photos.map((p) => {
        if (p.id === photoId) {
          return {
            ...p,
            reactions: [
              ...p.reactions.filter((r) => r.userId !== prev.currentUser.id),
              {
                userId: prev.currentUser.id,
                userName: prev.currentUser.name,
                emoji,
              },
            ],
          };
        }
        return p;
      }),
    }));
  };

  // Helper for demo / test: toggles partner workout completed
  const triggerPartnerCheckin = () => {
    hapticFeedback([20, 20]);
    setData((prev) => {
      const isCurrentlyPending = prev.partner.statusToday === "pending";
      const newStatus = isCurrentlyPending ? ("completed" as const) : ("pending" as const);
      const newPartner = {
        ...prev.partner,
        statusToday: newStatus,
        todayWorkoutTitle: newStatus === "completed" ? "Legs & Core Intensity" : undefined,
        weeklyCompletedDays: newStatus === "completed" ? prev.partner.weeklyCompletedDays + 1 : prev.partner.weeklyCompletedDays - 1,
      };

      const bothDone = prev.currentUser.statusToday === "completed" && newStatus === "completed";
      if (bothDone) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ["#CCFF00", "#10B981", "#FFFFFF"],
        });
      }

      return {
        ...prev,
        partner: newPartner,
        sharedStreak: bothDone ? prev.sharedStreak + 1 : prev.sharedStreak,
      };
    });
  };

  return (
    <DuoContext.Provider
      value={{
        data,
        logWorkout,
        addPhoto,
        sendNudge,
        addReaction,
        triggerPartnerCheckin,
        hapticFeedback,
      }}
    >
      {children}
    </DuoContext.Provider>
  );
}

export function useDuo() {
  const context = useContext(DuoContext);
  if (!context) {
    throw new Error("useDuo must be used within a DuoProvider");
  }
  return context;
}
