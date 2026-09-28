"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { 
  Check, 
  Flame, 
  Camera, 
  Copy, 
  Users, 
  Image as ImageIcon, 
  Calendar,
  Clock,
  Plus,
  Trash2,
  X,
  Zap,
  ChevronRight,
  ChevronDown,
  UserMinus
} from "lucide-react";
import confetti from "canvas-confetti";
import { InstallPwaPrompt } from "@/components/pwa/InstallPwaPrompt";
import { PullToRefresh } from "@/components/pwa/PullToRefresh";
import { useAppUpdater } from "@/hooks/useAppUpdater";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Exercise {
  name: string;
  sets?: string | number;
  reps?: string | number;
}

interface WorkoutLog {
  date: string;
  exercises: Exercise[];
  updatedAt?: string;
}

interface Photo { 
  url: string; 
  caption?: string; 
  date: string;
  owner?: string;
}

interface PartnerData {
  name: string;
  code: string;
  image?: string | null;
  logs: string[];
  workoutLogs?: WorkoutLog[];
  photos: Photo[];
}

interface MeData {
  name: string;
  code: string;
  image?: string | null;
  logs: string[];
  workoutLogs?: WorkoutLog[];
  photos: Photo[];
  hasPartner: boolean;
  partner: PartnerData | null;
}

// ─── Date Helpers ──────────────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthCalendar(year: number, monthIndex: number) {
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const firstDay = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay(); // 0 = Sun
  
  const days: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(Date.UTC(year, monthIndex, i));
    days.push(d.toISOString().slice(0, 10));
  }
  const monthName = new Date(Date.UTC(year, monthIndex, 1)).toLocaleDateString('en-US', { 
    month: 'long', 
    timeZone: 'UTC' 
  });
  return { year, monthIndex, monthName, days };
}

function getMonthsRange(earliestDateStr: string, currentDateStr: string) {
  const [startYear, startMonthNum] = (earliestDateStr || currentDateStr).split('-').map(Number);
  const [endYear, endMonthNum] = currentDateStr.split('-').map(Number);

  let y = startYear;
  let m = startMonthNum - 1; // 0-indexed
  const endM = endMonthNum - 1;

  const months: { year: number; month: number }[] = [];
  while (y < endYear || (y === endYear && m <= endM)) {
    months.push({ year: y, month: m });
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return months.reverse();
}

function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

function dayShort(dateKey: string) {
  const d = new Date(dateKey + "T12:00:00");
  if (dateKey === todayKey()) return "Today";
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function dayNumber(dateKey: string) {
  const d = new Date(dateKey + "T12:00:00");
  return d.getDate();
}

function displayDate(dateKey: string) {
  const d = new Date(dateKey + "T12:00:00");
  if (dateKey === todayKey()) return "Today";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function displayFullDate(dateKey: string) {
  if (!dateKey) return "";
  const d = new Date(dateKey + "T12:00:00");
  if (dateKey === todayKey()) return `Today (${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
  if (dateKey === offsetDateKey(-1)) return `Yesterday (${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function offsetDateKey(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function calculateStreak(logs: string[] = []): number {
  if (!logs || logs.length === 0) return 0;
  const set = new Set(logs);
  const today = todayKey();
  const yesterday = offsetDateKey(-1);

  const checkDate = set.has(today) ? today : (set.has(yesterday) ? yesterday : null);
  if (!checkDate) return 0;

  let streak = 0;
  const d = new Date(checkDate + "T12:00:00");
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ─── Countdown Timer Component (PWA & Background-Resilient) ───────────────────

function TomorrowCountdown({ onDayRoll }: { onDayRoll?: () => void }) {
  const [timeLeft, setTimeLeft] = useState<string>("24:00:00");
  const lastDateRef = useRef<string>("");

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const currentDayString = now.toDateString();

      // If the day rolled over while in background or active, notify parent
      if (lastDateRef.current && lastDateRef.current !== currentDayString) {
        onDayRoll?.();
      }
      lastDateRef.current = currentDayString;

      // Calculate exact ms until next local midnight (tomorrow 00:00:00)
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0
      ).getTime();

      const diff = Math.max(0, nextMidnight - now.getTime());
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    // Calculate immediately
    calculateTime();

    // Regular 1-second interval
    const intervalId = setInterval(calculateTime, 1000);

    // Resync immediately when coming back from background
    const handleSync = () => {
      calculateTime();
    };

    document.addEventListener("visibilitychange", handleSync);
    window.addEventListener("focus", handleSync);
    window.addEventListener("pageshow", handleSync);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleSync);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("pageshow", handleSync);
    };
  }, [onDayRoll]);

  return <span>{timeLeft}</span>;
}

// ─── Avatar Helper ─────────────────────────────────────────────────────────────

function getAvatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
}

// ─── Cloudinary Upload Helper ──────────────────────────────────────────────────

async function uploadToCloudinary(file: File): Promise<string> {
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "duoLift";
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dwkaudbjt";

  // Try unsigned preset upload first
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", preset);
    const up = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: form,
    });
    const data = await up.json();
    if (up.ok && data.secure_url) {
      return data.secure_url as string;
    }
  } catch (e) {
    console.warn("Unsigned upload attempt error, trying signed:", e);
  }

  // Fallback to signed upload
  const res = await fetch("/api/cloudinary/sign", { method: "POST" });
  const { signature, timestamp, folder, apiKey, cloudName: serverCloudName } = await res.json();
  const form = new FormData();
  form.append("file", file);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("api_key", apiKey);
  form.append("folder", folder);
  const up = await fetch(`https://api.cloudinary.com/v1_1/${serverCloudName || cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = await up.json();
  if (!up.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Cloudinary upload failed");
  }
  return data.secure_url as string;
}

// ─── Routine Modals ────────────────────────────────────────────────────────────

function WorkoutRoutineModal({
  isOpen,
  onClose,
  onSave,
  initialExercises,
  lastWorkout,
  saving,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercises: Exercise[]) => Promise<void>;
  initialExercises: Exercise[];
  lastWorkout: { date: string; exercises: Exercise[] } | null;
  saving: boolean;
}) {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialExercises && initialExercises.length > 0) {
        setExercises(initialExercises.map(e => ({ ...e })));
      } else {
        setExercises([{ name: "", sets: "", reps: "" }]);
      }
    }
  }, [isOpen, initialExercises]);

  if (!isOpen) return null;

  const addRow = () => {
    setExercises(prev => [...prev, { name: "", sets: "", reps: "" }]);
  };

  const updateRow = (index: number, field: keyof Exercise, value: string) => {
    setExercises(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeRow = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const copyLast = () => {
    if (lastWorkout && lastWorkout.exercises && lastWorkout.exercises.length > 0) {
      setExercises(lastWorkout.exercises.map(e => ({ ...e })));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = exercises.filter(e => e.name.trim().length > 0);
    onSave(valid);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-t-[36px] sm:rounded-[36px] p-6 pb-8 sm:pb-6 max-h-[88vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-medium tracking-tight">Today&apos;s Workout</h3>
            <p className="text-xs text-gray-400 mt-0.5">Log or add exercises anytime today</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Same as last workout banner */}
        {lastWorkout && lastWorkout.exercises && lastWorkout.exercises.length > 0 && (
          <button
            type="button"
            onClick={copyLast}
            className="mt-4 w-full p-4 rounded-2xl bg-black text-white flex items-center justify-between text-left hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-tight">Same as last workout?</p>
                <p className="text-[11px] text-gray-400">
                  Copy {lastWorkout.exercises.length} exercises from {displayDate(lastWorkout.date)}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 group-hover:underline">
              Copy ⚡
            </span>
          </button>
        )}

        {/* Exercise List */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 mt-4">
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1 mb-1">
              <span className="col-span-6">Exercise</span>
              <span className="col-span-2 text-center">Sets</span>
              <span className="col-span-3 text-center">Reps / Count</span>
              <span className="col-span-1"></span>
            </div>

            {exercises.map((ex, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <input
                    value={ex.name}
                    onChange={e => updateRow(i, "name", e.target.value)}
                    placeholder="e.g. Jumping jacks"
                    className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    value={ex.sets ?? ""}
                    onChange={e => updateRow(i, "sets", e.target.value)}
                    placeholder="Sets"
                    className="w-full bg-gray-100 rounded-2xl px-2 py-3 text-xs font-medium text-center focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    value={ex.reps ?? ""}
                    onChange={e => updateRow(i, "reps", e.target.value)}
                    placeholder="Reps"
                    className="w-full bg-gray-100 rounded-2xl px-2 py-3 text-xs font-medium text-center focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addRow}
              className="w-full py-3 rounded-2xl border border-dashed border-gray-200 text-gray-600 hover:text-black hover:border-gray-400 flex items-center justify-center gap-1.5 text-xs font-bold transition-all mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Exercise</span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 mt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-2 py-4 bg-black text-white rounded-2xl text-xs font-bold hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 shadow-lg cursor-pointer"
            >
              {saving ? "Saving..." : "Save Routine"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Edit Profile (PFP & Name) ────────────────────────────────────────

function EditProfileModal({
  isOpen,
  onClose,
  currentName,
  currentImage,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentImage?: string | null;
  onSaved: () => void;
}) {
  const { signOut } = useClerk();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(currentName);
  const [previewImage, setPreviewImage] = useState(currentImage || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(currentName);
    setPreviewImage(currentImage || "");
    setError("");
  }, [currentName, currentImage, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError("");
    try {
      const url = await uploadToCloudinary(file);
      setPreviewImage(url);
    } catch (err) {
      console.error(err);
      setError("Failed to upload photo. Try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRandomize = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    setPreviewImage(getAvatarUrl(randomSeed));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          image: previewImage,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update profile");
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-[36px] sm:rounded-[36px] p-6 pb-8 sm:pb-6 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
              SETTINGS
            </span>
            <h3 className="text-xl font-medium tracking-tight mt-0.5">
              Edit Profile
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-5 space-y-6">
          {/* Avatar Upload / Preview */}
          <div className="flex flex-col items-center gap-3">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-gray-100 shadow-md cursor-pointer group bg-gray-50 flex items-center justify-center hover:ring-4 hover:ring-black/10 transition-all"
              title="Click to change photo"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage || getAvatarUrl(name || "User")}
                alt="Profile picture"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold tracking-tight">Change</span>
              </div>
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="text-xs font-bold text-black underline underline-offset-4 hover:opacity-70 transition-opacity cursor-pointer"
              >
                {uploadingImage ? "Uploading..." : "Upload Photo"}
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                onClick={handleRandomize}
                className="text-xs font-bold text-gray-500 hover:text-black transition-colors cursor-pointer"
              >
                Random Avatar
              </button>
            </div>
          </div>

          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block px-1">
              DISPLAY NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              maxLength={40}
              className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400"
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-red-500 text-center px-2">{error}</p>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="w-full py-4 bg-black text-white rounded-2xl text-xs font-bold hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 shadow-lg cursor-pointer"
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full py-3.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Sign Out</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Day Workout Details (You & Partner) ──────────────────────────────

function DayWorkoutModal({
  isOpen,
  onClose,
  dateKey,
  me,
  partner,
  onOpenRoutineLogger,
  initialTab = "me",
}: {
  isOpen: boolean;
  onClose: () => void;
  dateKey: string;
  me: MeData;
  partner: PartnerData | null;
  onOpenRoutineLogger?: () => void;
  initialTab?: "me" | "partner";
}) {
  const [activeTab, setActiveTab] = useState<"me" | "partner">(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen || !dateKey) return null;

  const partnerName = partner?.name ? partner.name.split(" ")[0] : "Partner";

  const meDone = me.logs.includes(dateKey);
  const partnerDone = partner?.logs.includes(dateKey) ?? false;

  const meWorkout = me.workoutLogs?.find(w => w.date === dateKey);
  const partnerWorkout = partner?.workoutLogs?.find(w => w.date === dateKey);

  const meExercises = meWorkout?.exercises ?? [];
  const partnerExercises = partnerWorkout?.exercises ?? [];

  const isTodayDate = dateKey === todayKey();

  const currentTab = partner ? activeTab : "me";
  const currentExercises = currentTab === "me" ? meExercises : partnerExercises;
  const currentDone = currentTab === "me" ? meDone : partnerDone;
  const currentPersonName = currentTab === "me" ? "You" : partnerName;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-[36px] sm:rounded-[36px] p-6 pb-8 sm:pb-6 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
              WORKOUT DETAILS
            </span>
            <h3 className="text-xl font-medium tracking-tight mt-0.5">
              {displayFullDate(dateKey)}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: You vs Partner */}
        {partner && (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-2xl mt-4">
            <button
              type="button"
              onClick={() => setActiveTab("me")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "me"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              <span>You</span>
              {meDone && <Check className="w-3.5 h-3.5 stroke-[3] text-black" />}
              {meExercises.length > 0 && (
                <span className="text-[10px] font-mono opacity-60">({meExercises.length})</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("partner")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "partner"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              <span>{partnerName}</span>
              {partnerDone && <Check className="w-3.5 h-3.5 stroke-[3] text-black" />}
              {partnerExercises.length > 0 && (
                <span className="text-[10px] font-mono opacity-60">({partnerExercises.length})</span>
              )}
            </button>
          </div>
        )}

        {/* Exercises List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {currentExercises.length > 0 ? (
            currentExercises.map((ex, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-gray-50 flex items-center justify-between">
                <span className="text-sm font-medium text-black">{ex.name}</span>
                <span className="text-xs font-mono font-bold bg-white px-3 py-1.5 rounded-xl shadow-xs text-gray-700">
                  {ex.sets ? `${ex.sets} × ` : ""}{ex.reps ?? ""}
                </span>
              </div>
            ))
          ) : currentDone ? (
            <div className="text-center py-10 px-4 space-y-1">
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <p className="text-sm font-bold text-black">{currentPersonName} completed workout</p>
              <p className="text-xs text-gray-400">No specific exercises were listed for this day.</p>
            </div>
          ) : (
            <div className="text-center py-10 px-4 space-y-1">
              <p className="text-sm font-medium text-gray-400">
                {currentPersonName} did not log a workout for this date.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-gray-100 flex gap-2">
          {isTodayDate && currentTab === "me" && onOpenRoutineLogger && (
            <button
              onClick={() => {
                onClose();
                onOpenRoutineLogger();
              }}
              className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-black rounded-2xl text-xs font-bold cursor-pointer transition-colors"
            >
              {meDone ? "Edit Routine" : "Log Routine"}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-black text-white rounded-2xl text-xs font-bold cursor-pointer hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component: Checklist Board (Minimalist: Today, Tomorrow, Yesterday) ────────

function ChecklistBoard({ 
  me, 
  partner, 
  onOpenRoutineLogger,
  onOpenDayModal,
  onQuickLog, 
  logging, 
  onRefresh 
}: { 
  me: MeData; 
  partner: PartnerData | null;
  onOpenRoutineLogger: () => void;
  onOpenDayModal: (dateKey: string, initialTab?: "me" | "partner") => void;
  onQuickLog: () => void;
  logging: boolean;
  onRefresh: () => void;
}) {
  const today = todayKey();
  const yesterday = offsetDateKey(-1);
  const tomorrow = offsetDateKey(1);

  const meTodayDone = me.logs.includes(today);
  const partnerTodayDone = partner?.logs.includes(today);

  const meYesterdayDone = me.logs.includes(yesterday);
  const partnerYesterdayDone = partner?.logs.includes(yesterday);

  const meTodayWorkout = me.workoutLogs?.find(w => w.date === today);
  const partnerTodayWorkout = partner?.workoutLogs?.find(w => w.date === today);

  const meYesterdayWorkout = me.workoutLogs?.find(w => w.date === yesterday);
  const partnerYesterdayWorkout = partner?.workoutLogs?.find(w => w.date === yesterday);

  const partnerName = partner?.name ? partner.name.split(" ")[0] : "Partner";

  return (
    <div className="space-y-3 pb-20">
      {/* 1. TODAY CARD (Active hero) */}
      <div className="p-6 rounded-[32px] bg-black text-white shadow-xl flex flex-col justify-between gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
              TODAY
            </p>
            <p className="text-5xl font-medium tracking-tight mt-1">
              {dayNumber(today)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* You (Tap to open logger / log) */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={onOpenRoutineLogger}
                disabled={logging}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  meTodayDone
                    ? "bg-white text-black shadow-md cursor-pointer"
                    : "bg-zinc-800 text-white hover:bg-zinc-700 active:scale-95 cursor-pointer ring-1 ring-white/10"
                }`}
                title={meTodayDone ? "Edit today's routine" : "Log today's workout"}
              >
                {meTodayDone ? (
                  <Check className="w-6 h-6 stroke-[3]" />
                ) : logging ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-white opacity-40 animate-pulse" />
                )}
              </button>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                You
              </span>
            </div>

            {/* Partner */}
            {partner && (
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenDayModal(today, "partner")}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer hover:ring-2 hover:ring-white/40 ${
                    partnerTodayDone ? "bg-white text-black shadow-md" : "bg-zinc-800 text-gray-400"
                  }`}
                  title={`View ${partnerName}'s workout`}
                >
                  {partnerTodayDone ? (
                    <Check className="w-6 h-6 stroke-[3]" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-white opacity-20" />
                  )}
                </button>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {partnerName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Workouts Overview (You & Partner) */}
        <div className="pt-3 border-t border-zinc-800/80 space-y-2.5">
          {/* You row */}
          <div className="flex items-center justify-between gap-2">
            <div 
              onClick={() => meTodayDone ? onOpenDayModal(today, "me") : onOpenRoutineLogger()}
              className="min-w-0 flex-1 cursor-pointer group"
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">YOUR ROUTINE</p>
              {meTodayWorkout?.exercises?.length ? (
                <p className="text-xs text-gray-200 font-medium truncate group-hover:text-white transition-colors">
                  {meTodayWorkout.exercises.map(e => e.name).join(", ")}
                </p>
              ) : (
                <p className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                  {meTodayDone ? "Completed (tap to view / edit)" : "No workout logged yet"}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenRoutineLogger}
              className="shrink-0 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{meTodayDone ? "Edit" : "Log"}</span>
            </button>
          </div>

          {/* Partner row (if linked) */}
          {partner && (
            <div 
              onClick={() => onOpenDayModal(today, "partner")}
              className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-2 cursor-pointer group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {partnerName.toUpperCase()}&apos;S ROUTINE
                </p>
                {partnerTodayWorkout?.exercises?.length ? (
                  <p className="text-xs text-gray-200 font-medium truncate group-hover:text-white transition-colors">
                    {partnerTodayWorkout.exercises.map(e => e.name).join(", ")}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                    {partnerTodayDone ? "Completed workout" : `Waiting for ${partnerName} to log...`}
                  </p>
                )}
              </div>

              <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-gray-400 group-hover:text-white transition-colors">
                <span>View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. TOMORROW CARD (Live 24h Countdown Timer) */}
      <div className="p-6 rounded-[32px] bg-white text-black shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
            TOMORROW
          </p>
          <p className="text-5xl font-medium tracking-tight mt-1">
            {dayNumber(tomorrow)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black text-white font-mono text-sm font-bold tracking-tight shadow-sm">
            <Clock className="w-4 h-4 text-gray-300 animate-pulse" />
            <TomorrowCountdown onDayRoll={onRefresh} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1">
            STARTS IN
          </span>
        </div>
      </div>

      {/* 3. YESTERDAY CARD (Past Record) */}
      <div className="p-6 rounded-[32px] bg-white text-black shadow-sm flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
              YESTERDAY
            </p>
            <p className="text-5xl font-medium tracking-tight mt-1">
              {dayNumber(yesterday)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* You */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenDayModal(yesterday, "me")}
                className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-black/20 transition-all ${
                  meYesterdayDone ? "bg-black text-white shadow-sm" : "bg-gray-100 text-gray-400"
                }`}
                title="View your yesterday routine"
              >
                {meYesterdayDone ? (
                  <Check className="w-6 h-6 stroke-[3]" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-current opacity-20" />
                )}
              </button>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                You
              </span>
            </div>

            {/* Partner */}
            {partner && (
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenDayModal(yesterday, "partner")}
                  className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-black/20 transition-all ${
                    partnerYesterdayDone ? "bg-black text-white shadow-sm" : "bg-gray-100 text-gray-400"
                  }`}
                  title={`View ${partnerName}'s yesterday routine`}
                >
                  {partnerYesterdayDone ? (
                    <Check className="w-6 h-6 stroke-[3]" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-current opacity-20" />
                  )}
                </button>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {partnerName}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
          <div className="space-y-0.5 min-w-0 pr-2">
            <p className="text-gray-700 font-medium truncate">
              <span className="font-bold text-black">You:</span>{" "}
              {meYesterdayDone 
                ? (meYesterdayWorkout?.exercises?.length ? `${meYesterdayWorkout.exercises.length} exercises logged` : "Completed") 
                : "Rest day"}
            </p>
            {partner && (
              <p className="text-gray-700 font-medium truncate">
                <span className="font-bold text-black">{partnerName}:</span>{" "}
                {partnerYesterdayDone 
                  ? (partnerYesterdayWorkout?.exercises?.length ? `${partnerYesterdayWorkout.exercises.length} exercises logged` : "Completed") 
                  : "Rest day"}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onOpenDayModal(yesterday)}
            className="shrink-0 px-3.5 py-2 rounded-full bg-black text-white text-[11px] font-bold flex items-center gap-1 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <span>View</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dynamic Months Activity (From first active month to present month) */}
      {(() => {
        const allLogs = [...(me.logs || []), ...(partner?.logs || [])].filter(Boolean).sort();
        const earliestDateStr = allLogs.length > 0 ? allLogs[0] : today;
        const monthsList = getMonthsRange(earliestDateStr, today);

        return monthsList.map(({ year: mYear, month: mMonthIndex }) => {
          const monthCal = getMonthCalendar(mYear, mMonthIndex);
          return (
            <div key={`${mYear}-${mMonthIndex}`} className="bg-white rounded-[32px] p-6 shadow-sm mt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-500 uppercase tracking-widest text-[11px]">
                    {monthCal.monthName} {mYear} Activity
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                    Tap any day to view routines
                  </p>
                </div>
                {partner && (
                  <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-black block" /> Both</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 block" /> One</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-[10px] font-bold text-gray-400 mb-1">{day}</div>
                ))}
                {monthCal.days.map((d, i) => {
                  if (!d) return <div key={`empty-${i}`} className="aspect-square" />;
                  const dayNum = parseInt(d.split('-')[2], 10);
                  const meDone = me.logs.includes(d);
                  const pDone = partner?.logs.includes(d);
                  const isFuture = d > today;
                  const isTodayDate = d === today;

                  let boxStyle = "bg-gray-100 text-gray-500 font-medium cursor-pointer hover:bg-gray-200";
                  if (isFuture) {
                    boxStyle = "bg-gray-50/70 text-gray-300 font-normal cursor-default";
                  } else if (partner) {
                    if (meDone && pDone) {
                      boxStyle = "bg-black text-white font-bold shadow-xs cursor-pointer hover:scale-110 active:scale-95";
                    } else if (meDone || pDone) {
                      boxStyle = "bg-gray-300 text-black font-semibold cursor-pointer hover:scale-110 active:scale-95";
                    } else {
                      boxStyle = "bg-gray-100 text-gray-400 font-medium cursor-pointer hover:bg-gray-200";
                    }
                  } else {
                    if (meDone) {
                      boxStyle = "bg-black text-white font-bold shadow-xs cursor-pointer hover:scale-110 active:scale-95";
                    } else {
                      boxStyle = "bg-gray-100 text-gray-500 font-medium cursor-pointer hover:bg-gray-200";
                    }
                  }

                  if (isTodayDate && !meDone && !isFuture) {
                    boxStyle += " ring-1.5 ring-black text-black font-bold";
                  }

                  return (
                    <button
                      type="button"
                      key={d}
                      disabled={isFuture}
                      onClick={() => !isFuture && onOpenDayModal(d)}
                      className={`aspect-square rounded-[10px] sm:rounded-[12px] flex items-center justify-center text-xs transition-all ${boxStyle}`}
                      title={isFuture ? d : `${d} - Tap to view routines`}
                    >
                      <span>{dayNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        });
      })()}

    </div>
  );
}

// ─── Component: Photos Feed (Day-wise Grouping) ────────────────────────────────

function PhotosFeed({ me, partner, onRefresh }: { me: MeData; partner: PartnerData | null; onRefresh: () => void; }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreviewFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handlePost = async () => {
    if (!previewFile) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(previewFile);
      await fetch("/api/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, caption }),
      });
      setPreviewFile(null);
      setPreviewUrl("");
      setCaption("");
      onRefresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const [uploaderFilter, setUploaderFilter] = useState<"all" | "me" | "partner">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setMonthPickerOpen(false);
      }
    }
    if (monthPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [monthPickerOpen]);

  const selectedMonthLabel = useMemo(() => {
    if (selectedMonth === "all") return "All Months";
    const [y, mo] = selectedMonth.split("-").map(Number);
    return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }, [selectedMonth]);

  const partnerName = partner?.name ? partner.name.split(" ")[0] : "Partner";

  const allPhotos: (Photo & { source: "me" | "partner" })[] = useMemo(() => [
    ...me.photos.map((p) => ({ ...p, owner: "You", source: "me" as const })),
    ...(partner?.photos ?? []).map((p) => ({ ...p, owner: partnerName, source: "partner" as const })),
  ], [me.photos, partner?.photos, partnerName]);

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    allPhotos.forEach((p) => {
      if (p.date && p.date.length >= 7) {
        monthsSet.add(p.date.slice(0, 7));
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [allPhotos]);

  const filteredPhotos = allPhotos.filter((p) => {
    if (uploaderFilter === "me" && p.source !== "me") return false;
    if (uploaderFilter === "partner" && p.source !== "partner") return false;
    if (selectedMonth !== "all" && !p.date.startsWith(selectedMonth)) return false;
    return true;
  });

  const groupedPhotos = filteredPhotos.reduce((acc, p) => {
    if (!acc[p.date]) acc[p.date] = [];
    acc[p.date].push(p);
    return acc;
  }, {} as Record<string, Photo[]>);

  const sortedDates = Object.keys(groupedPhotos).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6 pb-24">
      {/* Upload trigger or preview */}
      {previewUrl ? (
        <div className="bg-white rounded-[32px] p-4 shadow-xl space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="preview" className="w-full aspect-[4/5] object-cover rounded-[24px]" />
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className="w-full bg-gray-100 rounded-[20px] px-5 py-4 text-sm font-medium focus:outline-none placeholder:text-gray-400"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setPreviewFile(null); setPreviewUrl(""); }}
              className="flex-1 py-4 bg-gray-100 rounded-[20px] font-bold text-sm text-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={uploading}
              className="flex-1 py-4 bg-black text-white rounded-[20px] font-bold text-sm disabled:opacity-40"
            >
              {uploading ? "Posting..." : "Post Photo"}
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => fileRef.current?.click()}
          className="bg-black text-white p-6 rounded-[32px] flex items-center justify-between shadow-xl cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div>
            <h2 className="text-3xl font-medium tracking-tight">Upload</h2>
            <p className="text-gray-400 text-sm mt-1">Share a progress photo</p>
          </div>
          <div className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center">
            <Camera className="w-6 h-6" />
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      )}

      {/* Interactive Filters: Uploader & Month Selector */}
      {(partner || availableMonths.length > 0) && (
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* By Uploader */}
          {partner ? (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 shrink-0">By</span>
              <button
                type="button"
                onClick={() => setUploaderFilter("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  uploaderFilter === "all"
                    ? "bg-black text-white shadow-sm"
                    : "bg-white text-gray-500 hover:text-black border border-gray-100"
                }`}
              >
                Both
              </button>
              <button
                type="button"
                onClick={() => setUploaderFilter("me")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  uploaderFilter === "me"
                    ? "bg-black text-white shadow-sm"
                    : "bg-white text-gray-500 hover:text-black border border-gray-100"
                }`}
              >
                You
              </button>
              <button
                type="button"
                onClick={() => setUploaderFilter("partner")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  uploaderFilter === "partner"
                    ? "bg-black text-white shadow-sm"
                    : "bg-white text-gray-500 hover:text-black border border-gray-100"
                }`}
              >
                {partnerName}
              </button>
            </div>
          ) : (
            <div />
          )}

          {/* Custom Month Dropdown Pill & Bento Popover */}
          {availableMonths.length > 0 && (
            <div ref={monthPickerRef} className="relative inline-flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setMonthPickerOpen(!monthPickerOpen)}
                className={`flex items-center gap-1.5 font-bold text-xs pl-3.5 pr-3 py-1.5 rounded-full transition-all shadow-sm ${
                  selectedMonth !== "all" || monthPickerOpen
                    ? "bg-black text-white shadow-md"
                    : "bg-white text-gray-700 hover:text-black border border-gray-200"
                }`}
              >
                <span>{selectedMonthLabel}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    monthPickerOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Bento Popover */}
              {monthPickerOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white/95 backdrop-blur-md rounded-[24px] p-1.5 shadow-2xl border border-gray-100 z-50 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMonth("all");
                      setMonthPickerOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-[18px] text-xs font-bold flex items-center justify-between transition-colors ${
                      selectedMonth === "all"
                        ? "bg-black text-white"
                        : "text-gray-600 hover:text-black hover:bg-gray-100"
                    }`}
                  >
                    <span>All Months</span>
                    {selectedMonth === "all" && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="max-h-56 overflow-y-auto no-scrollbar space-y-1">
                    {availableMonths.map((m) => {
                      const [y, mo] = m.split("-").map(Number);
                      const label = new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      });
                      const isSelected = selectedMonth === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(m);
                            setMonthPickerOpen(false);
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-[18px] text-xs font-bold flex items-center justify-between transition-colors ${
                            isSelected
                              ? "bg-black text-white"
                              : "text-gray-600 hover:text-black hover:bg-gray-100"
                          }`}
                        >
                          <span>{label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grid of photos grouped by day */}
      {sortedDates.length === 0 ? (
        <div className="p-12 text-center mt-6 bg-white rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-gray-400 font-medium text-base">No photos found</p>
          {(uploaderFilter !== "all" || selectedMonth !== "all") && (
            <button
              onClick={() => { setUploaderFilter("all"); setSelectedMonth("all"); }}
              className="mt-3 text-xs font-bold text-black underline underline-offset-4"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(date => (
            <div key={date}>
              <h3 className="text-2xl font-medium tracking-tight mb-4 px-2">
                {displayDate(date)}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {groupedPhotos[date].map((p, i) => (
                  <div key={i} className="bg-white rounded-[24px] overflow-hidden shadow-sm p-2 flex flex-col">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className="w-full aspect-[4/5] object-cover rounded-[16px]" />
                    <div className="pt-3 pb-2 px-2 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.owner}</span>
                      {p.caption && (
                        <span className="text-[11px] text-black font-medium truncate ml-2">{p.caption}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Component: Buddy Tab ──────────────────────────────────────────────────────

function BuddyTab({ 
  data, 
  onPaired, 
  onOpenProfileModal 
}: { 
  data: MeData; 
  onPaired: () => void; 
  onOpenProfileModal: () => void; 
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showUnpairConfirm, setShowUnpairConfirm] = useState(false);
  const [unpairing, setUnpairing] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: input.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Failed"); return; }
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      onPaired();
    } finally {
      setLoading(false);
    }
  };

  const handleUnpair = async () => {
    setUnpairing(true);
    try {
      const res = await fetch("/api/pair", { method: "DELETE" });
      if (res.ok) {
        setShowUnpairConfirm(false);
        onPaired();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUnpairing(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Install App Prompt */}
      <InstallPwaPrompt />

      {/* Account Profile Card */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={data.image || getAvatarUrl(data.name)} 
                alt={data.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-black text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
              <Camera className="w-2 h-2" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Profile</p>
            <h3 className="text-xl font-medium tracking-tight mt-0.5">{data.name}</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenProfileModal}
          className="px-4 py-2 rounded-full bg-black text-white text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          Edit
        </button>
      </div>

      {/* Your secret code card */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Your Code</p>
        <div className="flex items-center justify-between">
          <h2 className="text-5xl font-medium tracking-tighter">{data.code}</h2>
          <button 
            onClick={copyCode} 
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors cursor-pointer ${copied ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}
          >
            {copied ? <Check className="w-6 h-6" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Partner Status or Pair Form */}
      {data.hasPartner && data.partner ? (
        <div className="bg-black text-white rounded-[32px] p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Linked Partner</p>
              <h2 className="text-3xl font-medium tracking-tight">{data.partner.name.split(' ')[0]}</h2>
            </div>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white/10 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={data.partner.image || getAvatarUrl(data.partner.name)} 
                alt="partner avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-gray-400">Accountability Partner</span>
            <button
              type="button"
              onClick={() => setShowUnpairConfirm(true)}
              className="text-xs font-semibold text-red-400 hover:text-red-300 hover:underline flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>Remove Partner</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] p-6 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Link Partner</p>
          <form onSubmit={handlePair} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="ENTER CODE"
              className="flex-1 h-14 bg-gray-100 rounded-2xl px-5 text-base font-medium tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400 placeholder:tracking-normal placeholder:font-normal"
            />
            <button
              type="submit"
              disabled={loading || input.length < 6}
              className={`h-14 px-7 rounded-2xl font-bold text-sm transition-all flex items-center justify-center shrink-0 ${
                input.length === 6 && !loading
                  ? "bg-black text-white shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? "Linking..." : "Link"}
            </button>
          </form>
          {error && <p className="text-sm font-medium text-red-500 mt-3 px-2">{error}</p>}
        </div>
      )}

      {/* Unpair Confirmation Modal */}
      {showUnpairConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs bg-white rounded-[32px] p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
              <UserMinus className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-black">Remove Partner?</h3>
            <p className="text-xs text-gray-500 mt-2 mb-6 leading-relaxed">
              Are you sure you want to unlink from <span className="font-bold text-black">{data.partner?.name.split(" ")[0]}</span>? You won&apos;t share streaks or see each other&apos;s live activity until you link again.
            </p>
            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={handleUnpair}
                disabled={unpairing}
                className="w-full h-12 bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center cursor-pointer"
              >
                {unpairing ? "Removing..." : "Yes, Remove Partner"}
              </button>
              <button
                type="button"
                onClick={() => setShowUnpairConfirm(false)}
                disabled={unpairing}
                className="w-full h-12 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-700 rounded-2xl font-bold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Version & Refresh Status */}
      <div className="pt-2 pb-4 flex flex-col items-center justify-center gap-1 text-[11px] text-gray-400">
        <p className="font-mono">DuoLift {process.env.NEXT_PUBLIC_APP_VERSION ? `v${process.env.NEXT_PUBLIC_APP_VERSION}` : "v1.0"}</p>
        <p className="text-[10px] text-gray-400">Pull down to refresh & check updates</p>
      </div>
    </div>
  );
}

// ─── Main Shell Page ───────────────────────────────────────────────────────────

type Tab = "board" | "photos" | "buddy";

export default function Page() {
  const { isLoaded } = useAuth();
  const [data, setData] = useState<MeData | null>(null);
  const [tab, setTab] = useState<Tab>("board");
  const [logging, setLogging] = useState(false);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [dayModal, setDayModal] = useState<{
    isOpen: boolean;
    dateKey: string;
    initialTab?: "me" | "partner";
  }>({
    isOpen: false,
    dateKey: "",
    initialTab: "me",
  });

  const { checkForAppUpdate } = useAppUpdater();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleFullRefresh = useCallback(async () => {
    await Promise.allSettled([
      load(),
      checkForAppUpdate(true),
    ]);
  }, [load, checkForAppUpdate]);

  useEffect(() => {
    if (isLoaded) load();
  }, [isLoaded, load]);

  const today = todayKey();
  const loggedToday = data?.logs.includes(today) ?? false;

  const previousWorkouts = (data?.workoutLogs || [])
    .filter(w => w.date < today && w.exercises && w.exercises.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date));
  const lastWorkout = previousWorkouts[0] ?? null;

  const todayWorkout = (data?.workoutLogs || []).find(w => w.date === today);
  const todayExercises = todayWorkout?.exercises ?? [];

  const handleQuickLog = async () => {
    if (logging) return;
    setLogging(true);
    try {
      if ("vibrate" in navigator) navigator.vibrate([30, 50, 30]);
      await fetch("/api/log", { method: "POST" });
      await load();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#000000"] });
    } catch (e) {
      console.error(e);
    } finally {
      setLogging(false);
    }
  };

  const handleSaveRoutine = async (exercises: Exercise[]) => {
    setLogging(true);
    try {
      if ("vibrate" in navigator) navigator.vibrate([30, 50, 30]);
      await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercises }),
      });
      await load();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#000000"] });
      setRoutineModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLogging(false);
    }
  };

  if (!isLoaded || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EBEBEB]">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-black animate-spin" />
      </div>
    );
  }

  const myStreak = calculateStreak(data.logs);
  const partnerStreak = data.partner ? calculateStreak(data.partner.logs) : 0;

  return (
    <PullToRefresh onRefresh={handleFullRefresh}>
      <div className="min-h-screen bg-[#EBEBEB] text-[#111111] flex justify-center">
        <div className="w-full max-w-md px-4 pt-4 pb-8 flex flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8 px-2 mt-2">
          <div 
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center gap-3 cursor-pointer group"
            title="Edit profile & photo"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-full overflow-hidden border border-gray-200/80 shadow-sm flex items-center justify-center bg-white group-hover:scale-105 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={data.image || getAvatarUrl(data.name)} 
                  alt={data.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-black text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                <Camera className="w-2.5 h-2.5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h1 className="text-xl font-medium tracking-tight leading-tight group-hover:underline">
                  {data.name.split(' ')[0]}
                </h1>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Edit Profile</p>
            </div>
          </div>

          {data.hasPartner && data.partner ? (
            <div className="px-3.5 py-2 bg-white rounded-full flex items-center gap-2.5 shadow-sm">
              <div className="flex items-center gap-1.5" title="Your streak">
                <Flame className="w-4 h-4 text-black" />
                <span className="font-bold text-sm tracking-tight">{myStreak}</span>
              </div>
              <span className="w-px h-3.5 bg-gray-200" />
              <div className="flex items-center gap-1.5" title={`${data.partner.name.split(' ')[0]}'s streak`}>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {data.partner.name.split(' ')[0]}
                </span>
                <Flame className="w-4 h-4 text-black" />
                <span className="font-bold text-sm tracking-tight">{partnerStreak}</span>
              </div>
            </div>
          ) : (
            <div className="px-4 py-2 bg-white rounded-full flex items-center gap-2 shadow-sm">
              <Flame className="w-4 h-4 text-black" />
              <span className="font-bold text-sm tracking-tight">{myStreak}</span>
            </div>
          )}
        </header>

        {/* Dynamic Content */}
        {tab === "board" && (
          <div className="space-y-4">
            {!loggedToday && (
              <button 
                onClick={() => setRoutineModalOpen(true)} 
                disabled={logging} 
                className="w-full bg-black text-white p-6 rounded-[32px] flex items-center justify-between shadow-xl hover:scale-[1.02] transition-transform text-left cursor-pointer"
              >
                <div>
                  <h2 className="text-3xl font-medium tracking-tight">Log Workout</h2>
                  <p className="text-gray-400 text-sm mt-1">{logging ? "Saving..." : "Tap to log today's routine"}</p>
                </div>
                <div className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
              </button>
            )}
            <ChecklistBoard 
              me={data} 
              partner={data.partner} 
              onOpenRoutineLogger={() => setRoutineModalOpen(true)}
              onOpenDayModal={(dateKey, initialTab) => {
                setDayModal({
                  isOpen: true,
                  dateKey,
                  initialTab: initialTab ?? "me",
                });
              }}
              onQuickLog={handleQuickLog}
              logging={logging} 
              onRefresh={handleFullRefresh} 
            />
          </div>
        )}

        {tab === "photos" && (
          <PhotosFeed me={data} partner={data.partner} onRefresh={handleFullRefresh} />
        )}

        {tab === "buddy" && (
          <BuddyTab 
            data={data} 
            onPaired={handleFullRefresh} 
            onOpenProfileModal={() => setProfileModalOpen(true)} 
          />
        )}

      </div>

      {/* Routine Logger Modal */}
      <WorkoutRoutineModal
        isOpen={routineModalOpen}
        onClose={() => setRoutineModalOpen(false)}
        onSave={handleSaveRoutine}
        initialExercises={todayExercises}
        lastWorkout={lastWorkout}
        saving={logging}
      />

      {/* Day Workout Details Modal (You & Partner) */}
      <DayWorkoutModal
        isOpen={dayModal.isOpen}
        onClose={() => setDayModal(prev => ({ ...prev, isOpen: false }))}
        dateKey={dayModal.dateKey}
        me={data}
        partner={data.partner}
        onOpenRoutineLogger={() => setRoutineModalOpen(true)}
        initialTab={dayModal.initialTab}
      />

      {/* Edit Profile Modal (PFP & Name) */}
      <EditProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentName={data.name}
        currentImage={data.image}
        onSaved={load}
      />

      {/* Floating Bottom Nav (Pill style matching reference) */}
      <nav className={`fixed bottom-6 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none transition-all duration-200 ${
        (routineModalOpen || dayModal.isOpen || profileModalOpen) 
          ? "opacity-0 pointer-events-none translate-y-10" 
          : "opacity-100"
      }`}>
        <div className="pointer-events-auto flex items-center gap-2 p-1.5 bg-white rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
          {(
            [
              { id: "board" as Tab, icon: Calendar },
              { id: "photos" as Tab, icon: ImageIcon },
              { id: "buddy" as Tab, icon: Users },
            ] as const
          ).map(({ id, icon: Icon }) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isActive
                    ? "bg-black text-white shadow-md"
                    : "text-gray-400 hover:text-black hover:bg-gray-50"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
    </PullToRefresh>
  );
}
