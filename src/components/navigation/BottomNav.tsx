"use client";

import React from "react";
import { Dumbbell, Flame, Home, Image as ImageIcon, Users } from "lucide-react";
import { useDuo } from "@/context/DuoContext";

export type TabType = "home" | "workout" | "vault" | "duo";

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { hapticFeedback } = useDuo();

  const navItems = [
    { id: "home" as TabType, label: "Feed", icon: Home },
    { id: "workout" as TabType, label: "Log Lift", icon: Dumbbell },
    { id: "vault" as TabType, label: "Vault", icon: ImageIcon },
    { id: "duo" as TabType, label: "Duo Duel", icon: Users },
  ];

  return (
    <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 bg-[#121820]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                hapticFeedback(12);
                setActiveTab(item.id);
              }}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 font-medium text-xs sm:text-sm ${
                isActive
                  ? "bg-[#CCFF00] text-black font-semibold shadow-[0_0_20px_rgba(204,255,0,0.35)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isActive ? "text-black stroke-[2.5]" : "text-gray-400"}`} />
              <span className={isActive ? "inline" : "hidden sm:inline"}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
