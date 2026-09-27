"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Check, Clock, Dumbbell, X, Sparkles, Timer } from "lucide-react";
import { useDuo } from "@/context/DuoContext";
import { Exercise, ExerciseSet } from "@/lib/types";

interface WorkoutLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_TEMPLATES = [
  {
    title: "Push Day (Chest / Shoulders / Triceps)",
    category: "Push" as const,
    exercises: [
      { name: "Incline Dumbbell Press", muscleGroup: "Chest", sets: [{ setNumber: 1, weight: 32, reps: 10, completed: false }] },
      { name: "Flat Barbell Bench", muscleGroup: "Chest", sets: [{ setNumber: 1, weight: 80, reps: 8, completed: false }] },
      { name: "Cable Lateral Raises", muscleGroup: "Shoulders", sets: [{ setNumber: 1, weight: 12, reps: 15, completed: false }] },
      { name: "Overhead Tricep Extension", muscleGroup: "Triceps", sets: [{ setNumber: 1, weight: 25, reps: 12, completed: false }] },
    ],
  },
  {
    title: "Pull Day (Back / Rear Delts / Biceps)",
    category: "Pull" as const,
    exercises: [
      { name: "Lat Pulldown (Neutral)", muscleGroup: "Back", sets: [{ setNumber: 1, weight: 70, reps: 10, completed: false }] },
      { name: "Barbell Bent Over Row", muscleGroup: "Back", sets: [{ setNumber: 1, weight: 65, reps: 8, completed: false }] },
      { name: "Face Pulls", muscleGroup: "Shoulders", sets: [{ setNumber: 1, weight: 35, reps: 15, completed: false }] },
      { name: "Incline Bicep Curls", muscleGroup: "Biceps", sets: [{ setNumber: 1, weight: 14, reps: 12, completed: false }] },
    ],
  },
  {
    title: "Leg Day (Quads / Hamstrings / Calves)",
    category: "Legs" as const,
    exercises: [
      { name: "Barbell Back Squats", muscleGroup: "Quads", sets: [{ setNumber: 1, weight: 100, reps: 6, completed: false }] },
      { name: "Romanian Deadlifts", muscleGroup: "Hamstrings", sets: [{ setNumber: 1, weight: 90, reps: 8, completed: false }] },
      { name: "Leg Press", muscleGroup: "Quads", sets: [{ setNumber: 1, weight: 180, reps: 10, completed: false }] },
      { name: "Seated Calf Raises", muscleGroup: "Calves", sets: [{ setNumber: 1, weight: 45, reps: 15, completed: false }] },
    ],
  },
];

export function WorkoutLoggerModal({ isOpen, onClose }: WorkoutLoggerModalProps) {
  const { logWorkout, hapticFeedback } = useDuo();

  const [title, setTitle] = useState("Push Hypertrophy");
  const [category, setCategory] = useState<"Push" | "Pull" | "Legs" | "Full Body" | "Cardio">("Push");
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [notes, setNotes] = useState("");
  const [isPR, setIsPR] = useState(false);

  // Exercises list state
  const [exercises, setExercises] = useState<Exercise[]>([
    {
      name: "Incline Dumbbell Press",
      muscleGroup: "Chest",
      sets: [
        { setNumber: 1, weight: 32, reps: 10, completed: true },
        { setNumber: 2, weight: 34, reps: 8, completed: true },
        { setNumber: 3, weight: 36, reps: 7, completed: true },
      ],
    },
    {
      name: "Cable Lateral Raises",
      muscleGroup: "Shoulders",
      sets: [
        { setNumber: 1, weight: 12, reps: 15, completed: true },
        { setNumber: 2, weight: 14, reps: 12, completed: true },
      ],
    },
  ]);

  // Rest Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            hapticFeedback([80, 50, 80]);
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timerSeconds, hapticFeedback]);

  const startRestTimer = (seconds: number) => {
    hapticFeedback(20);
    setTimerSeconds(seconds);
    setTimerActive(true);
  };

  // Calculate live volume
  const totalVolume = exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((sAcc, s) => {
        return s.completed ? sAcc + (s.weight || 0) * (s.reps || 0) : sAcc;
      }, 0)
    );
  }, 0);

  const applyTemplate = (template: typeof PRESET_TEMPLATES[0]) => {
    hapticFeedback(15);
    setTitle(template.title);
    setCategory(template.category);
    setExercises(
      template.exercises.map((ex) => ({
        ...ex,
        sets: [
          { setNumber: 1, weight: ex.sets[0].weight, reps: ex.sets[0].reps, completed: false },
          { setNumber: 2, weight: ex.sets[0].weight, reps: ex.sets[0].reps, completed: false },
          { setNumber: 3, weight: ex.sets[0].weight, reps: ex.sets[0].reps, completed: false },
        ],
      }))
    );
  };

  const addExercise = () => {
    hapticFeedback(15);
    setExercises((prev) => [
      ...prev,
      {
        name: "New Exercise",
        muscleGroup: "Chest",
        sets: [{ setNumber: 1, weight: 20, reps: 10, completed: false }],
      },
    ]);
  };

  const removeExercise = (index: number) => {
    hapticFeedback(15);
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const addSet = (exerciseIndex: number) => {
    hapticFeedback(12);
    setExercises((prev) => {
      const updated = [...prev];
      const targetSets = updated[exerciseIndex].sets;
      const lastSet = targetSets[targetSets.length - 1];
      targetSets.push({
        setNumber: targetSets.length + 1,
        weight: lastSet ? lastSet.weight : 20,
        reps: lastSet ? lastSet.reps : 10,
        completed: false,
      });
      return updated;
    });
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    hapticFeedback(18);
    setExercises((prev) => {
      const updated = [...prev];
      const set = updated[exerciseIndex].sets[setIndex];
      set.completed = !set.completed;
      if (set.completed) {
        startRestTimer(90); // Auto start 90s rest timer on set check
      }
      return updated;
    });
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: "weight" | "reps",
    value: number
  ) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].sets[setIndex][field] = value;
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    logWorkout({
      title,
      category,
      durationMinutes,
      exercises,
      totalVolumeKg: totalVolume,
      notes,
      isPR,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full sm:max-w-xl max-h-[90vh] bg-[#121820] border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#161F2B]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#CCFF00] text-black flex items-center justify-center font-bold">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Log Today&apos;s Workout</h2>
              <p className="text-xs text-gray-400">Syncs immediately with your partner</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Quick Routine Presets */}
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-2 uppercase tracking-wider">
              Quick Routine Split
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {PRESET_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyTemplate(tmpl)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                    category === tmpl.category
                      ? "bg-[#CCFF00] text-black border-[#CCFF00] font-semibold"
                      : "bg-[#18212D] text-gray-300 border-white/5 hover:bg-white/5"
                  }`}
                >
                  {tmpl.category}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Category Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Session Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chest & Triceps"
                className="w-full bg-[#18212D] border border-white/10 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#CCFF00]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Duration (Mins)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-[#18212D] border border-white/10 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#CCFF00]"
              />
            </div>
          </div>

          {/* Rest Timer Floating Bar if active */}
          {timerSeconds > 0 && (
            <div className="p-3 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-[#CCFF00] animate-spin" />
                <span className="text-xs font-bold text-white">Rest Countdown</span>
              </div>
              <span className="text-lg font-mono font-bold text-[#CCFF00]">
                {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => setTimerSeconds(0)}
                className="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded bg-black/30"
              >
                Skip
              </button>
            </div>
          )}

          {/* Exercise Sets Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Exercises & Sets
              </span>
              <button
                type="button"
                onClick={addExercise}
                className="flex items-center gap-1 text-xs text-[#CCFF00] hover:underline font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Exercise
              </button>
            </div>

            {exercises.map((exercise, eIdx) => (
              <div
                key={eIdx}
                className="p-3.5 rounded-2xl bg-[#18212D] border border-white/5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={exercise.name}
                    onChange={(e) => {
                      const updated = [...exercises];
                      updated[eIdx].name = e.target.value;
                      setExercises(updated);
                    }}
                    className="bg-transparent font-bold text-sm text-white focus:outline-none flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeExercise(eIdx)}
                    className="text-gray-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sets Header */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-gray-400 px-1">
                  <span className="col-span-2">SET</span>
                  <span className="col-span-4">KG</span>
                  <span className="col-span-4">REPS</span>
                  <span className="col-span-2 text-center">DONE</span>
                </div>

                {/* Sets Rows */}
                {exercise.sets.map((set, sIdx) => (
                  <div
                    key={sIdx}
                    className={`grid grid-cols-12 gap-2 items-center p-1 rounded-xl transition-colors ${
                      set.completed ? "bg-[#CCFF00]/10" : "bg-black/20"
                    }`}
                  >
                    <span className="col-span-2 text-xs font-bold text-gray-400 pl-2">
                      {set.setNumber}
                    </span>

                    <div className="col-span-4">
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSet(eIdx, sIdx, "weight", Number(e.target.value))}
                        className="w-full bg-[#121820] text-center rounded-lg py-1 text-xs text-white font-semibold border border-white/10 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-4">
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(eIdx, sIdx, "reps", Number(e.target.value))}
                        className="w-full bg-[#121820] text-center rounded-lg py-1 text-xs text-white font-semibold border border-white/10 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => toggleSetComplete(eIdx, sIdx)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          set.completed
                            ? "bg-[#CCFF00] text-black shadow-[0_0_10px_rgba(204,255,0,0.5)]"
                            : "bg-white/10 text-gray-400 hover:bg-white/20"
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addSet(eIdx)}
                  className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 font-medium mt-1"
                >
                  <Plus className="w-3 h-3" /> Add Set
                </button>
              </div>
            ))}
          </div>

          {/* Notes & PR Toggle */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Session Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="How did the weights feel? Energy levels?"
                className="w-full bg-[#18212D] border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#18212D] border border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#CCFF00]" />
                <span className="text-xs font-semibold text-white">Did you hit a New PR today?</span>
              </div>
              <input
                type="checkbox"
                checked={isPR}
                onChange={(e) => setIsPR(e.target.checked)}
                className="w-4 h-4 accent-[#CCFF00] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer / Submit */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#161F2B] flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Total Volume</p>
            <p className="text-base font-extrabold text-[#CCFF00]">
              {totalVolume.toLocaleString()} kg
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-3 rounded-full bg-[#CCFF00] text-black font-bold text-sm shadow-[0_0_25px_rgba(204,255,0,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span>Finish &amp; Sync</span>
            <Check className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
}
