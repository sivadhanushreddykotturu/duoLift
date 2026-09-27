"use client";

import React, { useState } from "react";
import { Bell, Flame, Sparkles, Send } from "lucide-react";
import { useDuo } from "@/context/DuoContext";

export function DuoHeader() {
  const { data, sendNudge, triggerPartnerCheckin, hapticFeedback } = useDuo();
  const [showNudgeMenu, setShowNudgeMenu] = useState(false);

  const bothCompleted =
    data.currentUser.statusToday === "completed" && data.partner.statusToday === "completed";

  return (
    <header className="pt-4 pb-2 space-y-4">
      {/* Top Greeting Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.currentUser.avatar}
              alt={data.currentUser.name}
              className="w-11 h-11 rounded-2xl object-cover ring-2 ring-[#CCFF00]/40 p-0.5"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#CCFF00] rounded-full border-2 border-[#090D12] flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-black rounded-full" />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Welcome back</p>
            <h1 className="text-lg font-bold text-white tracking-tight">{data.currentUser.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Duo Streak Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161F2B] border border-white/10 shadow-sm">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide">
              {data.sharedStreak} <span className="text-[#CCFF00]">DAYS</span>
            </span>
          </div>

          <button
            onClick={() => {
              hapticFeedback(15);
              alert(
                data.lastNudge
                  ? `Last Nudge from ${data.lastNudge.fromName}: "${data.lastNudge.message}" (${data.lastNudge.time})`
                  : "No notifications right now!"
              );
            }}
            className="w-10 h-10 rounded-2xl bg-[#161F2B] border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:border-[#CCFF00]/40 transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Duo Partnership Interactive Live Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#141B24] via-[#121820] to-[#0E131A] border border-white/10 shadow-lg relative overflow-hidden">
        {/* Glow ambient accent */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#CCFF00]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          {/* User 1: Siva */}
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.currentUser.avatar}
              alt={data.currentUser.name}
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-emerald-500/50"
            />
            <div>
              <p className="text-xs font-semibold text-white">{data.currentUser.name} (You)</p>
              <div className="flex items-center gap-1 text-[11px]">
                {data.currentUser.statusToday === "completed" ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                    ● Lifted today
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium flex items-center gap-0.5">
                    ○ Not lifted yet
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sync indicator */}
          <div className="flex flex-col items-center px-2">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Duo Sync</span>
            <div className="h-0.5 w-10 bg-gradient-to-r from-emerald-500 via-[#CCFF00] to-orange-400 my-1 rounded-full" />
            <span className="text-[10px] text-gray-400">
              {bothCompleted ? "🔥 100% Synced" : "Waiting for buddy"}
            </span>
          </div>

          {/* User 2: Alex */}
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <p className="text-xs font-semibold text-white">{data.partner.name}</p>
              <div className="flex items-center justify-end gap-1 text-[11px]">
                {data.partner.statusToday === "completed" ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                    ● Lifted today
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium flex items-center gap-0.5">
                    ○ Pending
                  </span>
                )}
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.partner.avatar}
              alt={data.partner.name}
              className={`w-9 h-9 rounded-xl object-cover ring-2 ${
                data.partner.statusToday === "completed" ? "ring-emerald-500/50" : "ring-amber-500/50"
              }`}
            />
          </div>
        </div>

        {/* Nudge Action Bar */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowNudgeMenu(!showNudgeMenu);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium transition-colors border border-white/10"
            >
              <Send className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span>Nudge {data.partner.name}</span>
            </button>

            {/* Quick Demo Toggle for Partner */}
            <button
              onClick={triggerPartnerCheckin}
              title="Toggle partner status for testing"
              className="text-[10px] text-gray-400 hover:text-white px-2 py-1 rounded bg-black/30 border border-white/5"
            >
              {data.partner.statusToday === "completed" ? "Simulate: Mark Alex Pending" : "Simulate: Mark Alex Done"}
            </button>
          </div>

          {data.lastNudge && (
            <p className="text-[11px] text-gray-400 italic truncate max-w-[140px]">
              &quot;{data.lastNudge.message}&quot;
            </p>
          )}
        </div>

        {/* Nudge Picker Drawer */}
        {showNudgeMenu && (
          <div className="mt-3 p-2.5 rounded-2xl bg-[#1A232F] border border-white/10 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {[
              { emoji: "⚡", text: "Don't skip chest day bro!" },
              { emoji: "🔥", text: "Get in the gym! Streak is alive!" },
              { emoji: "💪", text: "Heavy lifting time!" },
              { emoji: "👀", text: "I already finished my sets, where are you?" },
            ].map((nudge, idx) => (
              <button
                key={idx}
                onClick={() => {
                  sendNudge(nudge.emoji, nudge.text);
                  setShowNudgeMenu(false);
                }}
                className="px-2.5 py-1 rounded-full bg-[#121820] hover:bg-[#CCFF00] hover:text-black text-gray-200 text-xs transition-colors flex items-center gap-1.5 border border-white/5"
              >
                <span>{nudge.emoji}</span>
                <span>{nudge.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
