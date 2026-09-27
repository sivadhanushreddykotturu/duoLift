"use client";

import React, { useState } from "react";
import { TrendingUp, Target, Award, Dumbbell, Zap, Calendar } from "lucide-react";
import { useDuo } from "@/context/DuoContext";

export function BentoStats() {
  const { data } = useDuo();
  const [selectedFilter, setSelectedFilter] = useState<"Today" | "Week" | "Month">("Week");

  // Radial calculation (4/5 days = 80%)
  const percentage = Math.round(
    (data.currentUser.weeklyCompletedDays / data.currentUser.weeklyGoalDays) * 100
  );
  const strokeDashoffset = 220 - (220 * Math.min(percentage, 100)) / 100;

  return (
    <div className="space-y-4">
      {/* Filter Ribbon matching Image 1 Segmented Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Overview</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] font-semibold border border-[#CCFF00]/20">
            Active
          </span>
        </h2>

        <div className="flex p-1 bg-[#141B24] rounded-full border border-white/10 text-xs font-medium">
          {(["Today", "Week", "Month"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedFilter(period)}
              className={`px-3 py-1 rounded-full transition-all ${
                selectedFilter === period
                  ? "bg-[#CCFF00] text-black font-semibold shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Card 1: Volume Moved (Inspired by Image 2 Balance card) */}
        <div className="p-5 rounded-3xl bg-[#141B24] border border-white/10 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Dumbbell className="w-4 h-4 text-[#CCFF00]" /> Total Tonnage Moved
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-[11px] text-gray-300">
                KG / LBS
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {data.currentUser.totalVolumeMonthKg.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-[#CCFF00]">kg</span>
            </div>

            {/* Trend Indicator Pill (Directly from Image 2) */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+14% volume</span>
              </div>
              <span className="text-xs text-gray-400">Great progressive overload</span>
            </div>
          </div>

          {/* Micro Bar Chart Visualizer */}
          <div className="mt-5 pt-3 border-t border-white/5 flex items-end justify-between gap-1.5 h-12">
            {[45, 60, 30, 85, 95, 70, 80].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-md transition-all duration-500 ${
                    i === 4
                      ? "bg-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.5)]"
                      : "bg-[#1E2734] hover:bg-[#2A3749]"
                  }`}
                  style={{ height: `${h}%` }}
                />
                <span className="text-[9px] text-gray-400">
                  {["M", "T", "W", "T", "F", "S", "S"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Semi-Circular Radial Goal Arc (Inspired by Image 2 Swiss Holiday card) */}
        <div className="p-5 rounded-3xl bg-[#141B24] border border-white/10 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Target className="w-4 h-4 text-emerald-400" /> Weekly Workout Target
            </span>
            <span className="text-xs text-white font-semibold">
              {data.currentUser.weeklyCompletedDays} / {data.currentUser.weeklyGoalDays} Days
            </span>
          </div>

          {/* Radial Progress Arc */}
          <div className="flex flex-col items-center justify-center my-1 relative">
            <svg className="w-44 h-24 transform translate-y-2" viewBox="0 0 160 90">
              {/* Background Arc */}
              <path
                d="M 20 80 A 60 60 0 0 1 140 80"
                fill="none"
                stroke="#1E2734"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Animated Progress Arc */}
              <path
                d="M 20 80 A 60 60 0 0 1 140 80"
                fill="none"
                stroke="#CCFF00"
                strokeWidth="12"
                strokeDasharray="220"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner stat display */}
            <div className="text-center absolute bottom-0">
              <span className="text-2xl font-black text-white">{percentage}%</span>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Goal Reached</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <span>Next session: Leg Day</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              ● 1 session to target
            </span>
          </div>
        </div>
      </div>

      {/* 2x2 Quick Metric Grid (Directly inspired by Image 3 iOS Plant Health screen) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-[#141B24] border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Duo Streak</span>
            <Zap className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
          </div>
          <p className="text-xl font-bold text-white">{data.sharedStreak} Days</p>
          <span className="text-[10px] text-emerald-400 mt-1">Unbroken chain</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141B24] border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>PRs Set</span>
            <Award className="w-3.5 h-3.5 text-[#CCFF00]" />
          </div>
          <p className="text-xl font-bold text-white">4 New PRs</p>
          <span className="text-[10px] text-[#CCFF00] mt-1">Bench & Squat</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141B24] border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Avg Session</span>
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-xl font-bold text-white">54 Mins</p>
          <span className="text-[10px] text-gray-400 mt-1">Optimal volume</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141B24] border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Buddy Rate</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <p className="text-xl font-bold text-white">94%</p>
          <span className="text-[10px] text-emerald-400 mt-1">Mutual check-in</span>
        </div>
      </div>
    </div>
  );
}
