"use client";

import React, { useState } from "react";
import { DuoProvider, useDuo } from "@/context/DuoContext";
import { BottomNav, TabType } from "@/components/navigation/BottomNav";
import { DuoHeader } from "@/components/dashboard/DuoHeader";
import { BentoStats } from "@/components/dashboard/BentoStats";
import { WorkoutPassCard } from "@/components/dashboard/WorkoutPassCard";
import { WorkoutLoggerModal } from "@/components/workout/WorkoutLoggerModal";
import { PhotoVaultView } from "@/components/vault/PhotoVaultView";
import { DuoDuelView } from "@/components/duo/DuoDuelView";
import { Plus, Dumbbell, Calendar, Filter } from "lucide-react";

function MainApp() {
  const { data, hapticFeedback } = useDuo();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [showLoggerModal, setShowLoggerModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(2); // Current day

  const calendarDays = [
    { day: "20", month: "Aug", name: "Wed" },
    { day: "21", month: "Aug", name: "Thu" },
    { day: "22", month: "Aug", name: "Today" },
    { day: "23", month: "Aug", name: "Sat" },
    { day: "24", month: "Aug", name: "Sun" },
  ];

  return (
    <div className="min-h-screen bg-[#090D12] text-white flex flex-col items-center">
      {/* Container constrained to mobile / tablet width */}
      <main className="w-full max-w-md sm:max-w-xl px-4 pb-28 pt-2 flex flex-col space-y-5">
        <DuoHeader />

        {activeTab === "home" && (
          <>
            {/* Calendar Date Selector Ribbon (Matching Image 1 Booking Calendar Ribbon) */}
            <div className="flex items-center justify-between gap-1.5 py-1">
              {calendarDays.map((d, idx) => {
                const isSelected = selectedDayIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      hapticFeedback(10);
                      setSelectedDayIndex(idx);
                    }}
                    className={`flex-1 py-2.5 rounded-2xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[#CCFF00] text-black font-extrabold shadow-[0_0_20px_rgba(204,255,0,0.3)] scale-105"
                        : "bg-[#141B24] text-gray-400 border border-white/5 hover:bg-[#1A232F]"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-tight opacity-75">
                      {d.name}
                    </span>
                    <span className="text-base font-black">{d.day}</span>
                  </button>
                );
              })}
            </div>

            {/* Bento Grid & Visualizer (Matching Image 2 & 3) */}
            <BentoStats />

            {/* Workout Feed Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Recent Sessions</h2>
                  <p className="text-xs text-gray-400">Boarding passes for logged workouts</p>
                </div>

                <button
                  onClick={() => {
                    hapticFeedback(15);
                    setShowLoggerModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-bold shadow-[0_0_15px_rgba(204,255,0,0.25)] transition-all"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Log Workout</span>
                </button>
              </div>

              {/* List of workout passes */}
              <div className="space-y-4">
                {data.workouts.map((workout) => (
                  <WorkoutPassCard key={workout.id} workout={workout} />
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "workout" && (
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-[#141B24] border border-white/10 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#CCFF00]/15 text-[#CCFF00] flex items-center justify-center mx-auto">
                <Dumbbell className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-white">Ready for Today&apos;s Session?</h2>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Track your sets, check weights, use the rest timer, and celebrate progress with your gym partner.
              </p>
              <button
                onClick={() => {
                  hapticFeedback(15);
                  setShowLoggerModal(true);
                }}
                className="px-6 py-3 rounded-full bg-[#CCFF00] text-black font-bold text-sm shadow-[0_0_20px_rgba(204,255,0,0.35)] hover:scale-105 active:scale-95 transition-all"
              >
                Launch Active Workout Logger
              </button>
            </div>

            {/* List of past workouts */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Workout History
              </h3>
              {data.workouts.map((workout) => (
                <WorkoutPassCard key={workout.id} workout={workout} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "vault" && <PhotoVaultView />}

        {activeTab === "duo" && <DuoDuelView />}
      </main>

      {/* Floating Bottom Nav */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === "workout") {
            setShowLoggerModal(true);
          } else {
            setActiveTab(tab);
          }
        }}
      />

      {/* Workout Logger Modal */}
      <WorkoutLoggerModal
        isOpen={showLoggerModal}
        onClose={() => setShowLoggerModal(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <DuoProvider>
      <MainApp />
    </DuoProvider>
  );
}
