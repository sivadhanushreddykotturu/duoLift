"use client";

import React, { useState } from "react";
import { Dumbbell, Clock, Flame, ChevronDown, ChevronUp, Share2, CheckCircle2 } from "lucide-react";
import { WorkoutLog } from "@/lib/types";
import { useDuo } from "@/context/DuoContext";

interface WorkoutPassCardProps {
  workout: WorkoutLog;
}

export function WorkoutPassCard({ workout }: WorkoutPassCardProps) {
  const { hapticFeedback } = useDuo();
  const [expanded, setExpanded] = useState(false);

  const formattedDate = new Date(workout.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative rounded-3xl bg-[#141B24] border border-white/10 overflow-hidden shadow-xl transition-all duration-300 hover:border-white/20">
      {/* Top Section */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={workout.userAvatar}
              alt={workout.userName}
              className="w-8 h-8 rounded-xl object-cover ring-1 ring-white/10"
            />
            <div>
              <p className="text-xs font-semibold text-white">{workout.userName}</p>
              <p className="text-[11px] text-gray-400">{formattedDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {workout.isPR && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 text-[11px] font-bold tracking-wide">
                ⚡ NEW PR
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/5 text-[11px] font-medium">
              {workout.category}
            </span>
          </div>
        </div>

        {/* Workout Title */}
        <h3 className="text-lg font-bold text-white tracking-tight">{workout.title}</h3>

        {/* Journey / Route Line (Inspired by Image 1 Train/Trip line) */}
        <div className="my-4 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400">Duration</span>
            <span className="text-sm font-semibold text-white flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#CCFF00]" /> {workout.durationMinutes} min
            </span>
          </div>

          <div className="flex-1 flex items-center gap-1 px-2">
            <div className="w-2 h-2 rounded-full bg-[#CCFF00]" />
            <div className="h-[2px] flex-1 bg-gradient-to-r from-[#CCFF00] via-emerald-400 to-[#00D2FF]" />
            <div className="w-2 h-2 rounded-full bg-[#00D2FF]" />
          </div>

          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-gray-400">Total Volume</span>
            <span className="text-sm font-semibold text-white flex items-center gap-1 justify-end">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-400" /> {workout.totalVolumeKg.toLocaleString()} kg
            </span>
          </div>
        </div>

        {workout.notes && (
          <p className="text-xs text-gray-300 bg-black/20 p-2.5 rounded-xl border border-white/5 italic">
            &quot;{workout.notes}&quot;
          </p>
        )}
      </div>

      {/* Perforated Ticket Divider with Notches (Image 1 Boarding Pass detail) */}
      <div className="relative flex items-center my-0">
        {/* Left notch */}
        <div className="w-5 h-5 bg-[#090D12] rounded-full -ml-2.5 border-r border-white/10" />
        {/* Dashed line */}
        <div className="flex-1 border-b border-dashed border-white/15 mx-1" />
        {/* Right notch */}
        <div className="w-5 h-5 bg-[#090D12] rounded-full -mr-2.5 border-l border-white/10" />
      </div>

      {/* Ticket Lower Stub / Barcode / Details */}
      <div className="p-4 sm:p-5 bg-[#10161E]/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Visual Barcode Graphic */}
            <div className="flex items-center gap-0.5 h-7 opacity-75">
              {[3, 1, 4, 2, 5, 2, 1, 4, 3, 2, 5, 1, 3, 4, 2].map((w, i) => (
                <div
                  key={i}
                  className="bg-white/70 rounded-full h-full"
                  style={{ width: `${w}px` }}
                />
              ))}
            </div>
            <div className="text-[10px] font-mono text-gray-400 tracking-wider">
              PASS#{workout.id.slice(-6).toUpperCase()}
            </div>
          </div>

          <button
            onClick={() => {
              hapticFeedback(12);
              setExpanded(!expanded);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-gray-200 font-medium transition-colors border border-white/10"
          >
            <span>{expanded ? "Hide Sets" : "View Breakdown"}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expanded Exercise Breakdown */}
        {expanded && (
          <div className="mt-4 pt-3 border-t border-white/5 space-y-3 animate-in fade-in duration-200">
            {workout.exercises.map((exercise, idx) => (
              <div key={idx} className="bg-black/30 p-3 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{exercise.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                    {exercise.muscleGroup}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {exercise.sets.map((set, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-1.5 rounded-lg bg-[#141B24] border border-white/5 flex flex-col items-center"
                    >
                      <span className="text-[10px] text-gray-400">Set {set.setNumber}</span>
                      <span className="font-semibold text-white">
                        {set.weight}kg × {set.reps}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
