"use client";

import React, { useState } from "react";
import { Copy, Check, Flame, Trophy, Send, Users, ShieldAlert, Sparkles } from "lucide-react";
import { useDuo } from "@/context/DuoContext";

export function DuoDuelView() {
  const { data, sendNudge, hapticFeedback } = useDuo();
  const [copied, setCopied] = useState(false);
  const [customNudge, setCustomNudge] = useState("");

  const handleCopyCode = () => {
    hapticFeedback(20);
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendCustomNudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNudge.trim()) return;
    sendNudge("🔥", customNudge);
    setCustomNudge("");
  };

  const totalDuelVolume = data.currentUser.totalVolumeMonthKg + data.partner.totalVolumeMonthKg;
  const userVolumePercent = Math.round((data.currentUser.totalVolumeMonthKg / totalDuelVolume) * 100) || 50;

  return (
    <div className="space-y-4 pb-20">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Duo Duel &amp; Partner</span>
          <Flame className="w-5 h-5 text-orange-400 fill-orange-400" />
        </h2>
        <p className="text-xs text-gray-400">Mutual accountability &amp; volume head-to-head</p>
      </div>

      {/* Head-to-Head Volume Duel Card */}
      <div className="p-5 rounded-3xl bg-[#141B24] border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#CCFF00]" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Monthly Volume Duel
            </span>
          </div>
          <span className="text-xs text-[#CCFF00] font-bold">
            {data.currentUser.name} leading (+{data.currentUser.totalVolumeMonthKg - data.partner.totalVolumeMonthKg}kg)
          </span>
        </div>

        {/* Dual Avatars and Tonnage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.currentUser.avatar}
              alt={data.currentUser.name}
              className="w-10 h-10 rounded-2xl object-cover ring-2 ring-[#CCFF00]"
            />
            <div>
              <p className="text-xs font-bold text-white">{data.currentUser.name}</p>
              <p className="text-sm font-extrabold text-[#CCFF00]">
                {data.currentUser.totalVolumeMonthKg.toLocaleString()} kg
              </p>
            </div>
          </div>

          <div className="text-center font-black text-xs text-gray-500">VS</div>

          <div className="flex items-center gap-2.5 text-right">
            <div>
              <p className="text-xs font-bold text-white">{data.partner.name}</p>
              <p className="text-sm font-extrabold text-cyan-400">
                {data.partner.totalVolumeMonthKg.toLocaleString()} kg
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.partner.avatar}
              alt={data.partner.name}
              className="w-10 h-10 rounded-2xl object-cover ring-2 ring-cyan-400"
            />
          </div>
        </div>

        {/* Dual Progress Bar */}
        <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden flex p-0.5 border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-[#CCFF00] to-emerald-400 rounded-l-full transition-all duration-700"
            style={{ width: `${userVolumePercent}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-r-full transition-all duration-700"
            style={{ width: `${100 - userVolumePercent}%` }}
          />
        </div>
      </div>

      {/* Shared Streak Status Box */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1A232F] to-[#121820] border border-orange-500/30 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
            Unbroken Duo Bond
          </span>
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
            <span>{data.sharedStreak} Days Streak</span>
            <Flame className="w-6 h-6 text-orange-400 fill-orange-400" />
          </h3>
          <p className="text-xs text-gray-400">
            {data.currentUser.statusToday === "completed" && data.partner.statusToday === "completed"
              ? "Both smashed workout today! Streak locked."
              : "Waiting on partner to check-in to lock today's streak."}
          </p>
        </div>
      </div>

      {/* Partner Invite Code Card */}
      <div className="p-5 rounded-3xl bg-[#141B24] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Your Duo Pairing Code
          </span>
          <span className="text-[10px] text-gray-400">Share with gym buddy</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/10">
          <span className="text-lg font-mono font-bold tracking-widest text-white">
            {data.code}
          </span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </button>
        </div>
      </div>

      {/* Send Custom Nudge to Partner */}
      <div className="p-5 rounded-3xl bg-[#141B24] border border-white/10 space-y-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
          Send Live Nudge to {data.partner.name}
        </span>
        <form onSubmit={handleSendCustomNudge} className="flex gap-2">
          <input
            type="text"
            value={customNudge}
            onChange={(e) => setCustomNudge(e.target.value)}
            placeholder="e.g. Bro are we hitting deadlifts today?"
            className="flex-1 bg-[#18212D] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-2xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nudge</span>
          </button>
        </form>
      </div>
    </div>
  );
}
