"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, Sparkles, Heart, Flame, Dumbbell, Zap, Plus, X, SlidersHorizontal } from "lucide-react";
import { useDuo } from "@/context/DuoContext";

export function PhotoVaultView() {
  const { data, addPhoto, addReaction, hapticFeedback } = useDuo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filter, setFilter] = useState<"All" | "Pump" | "Physique" | "Scale">("All");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // New photo upload form state
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [photoType, setPhotoType] = useState<"Pump" | "Physique" | "Scale" | "Meal">("Pump");
  const [bodyWeight, setBodyWeight] = useState<number | undefined>(75);

  // Compare slider state
  const [sliderPosition, setSliderPosition] = useState(50);

  const filteredPhotos = data.photos.filter((p) => {
    if (filter === "All") return true;
    return p.type === filter;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhoto = () => {
    if (!previewUrl) return;
    hapticFeedback(20);

    addPhoto({
      imageUrl: previewUrl,
      caption: caption || "Daily fitness update",
      type: photoType,
      bodyWeightKg: bodyWeight,
    });

    setPreviewUrl("");
    setCaption("");
    setShowUploadModal(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Physique Vault</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
              {data.photos.length} Photos
            </span>
          </h2>
          <p className="text-xs text-gray-400">Track visual muscle growth &amp; condition</p>
        </div>

        <div className="flex items-center gap-2">
          {data.photos.length >= 2 && (
            <button
              onClick={() => {
                hapticFeedback(12);
                setShowCompareModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white border border-white/10 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span className="hidden sm:inline">Compare</span>
            </button>
          )}

          <button
            onClick={() => {
              hapticFeedback(15);
              setShowUploadModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#CCFF00] hover:bg-[#b8e600] text-xs text-black font-bold shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all"
          >
            <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Snap</span>
          </button>
        </div>
      </div>

      {/* Filter Segmented Controls (Inspired by Image 3 All/In scanning/Completed) */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["All", "Pump", "Physique", "Scale"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              hapticFeedback(10);
              setFilter(tab);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              filter === tab
                ? "bg-[#CCFF00] text-black border-[#CCFF00] shadow-sm"
                : "bg-[#141B24] text-gray-400 border-white/5 hover:text-white"
            }`}
          >
            {tab === "All" ? "All Photos" : tab === "Pump" ? "Pump Pics" : tab === "Physique" ? "Physique Check" : "Scale Weight"}
          </button>
        ))}
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            className="rounded-3xl bg-[#141B24] border border-white/10 overflow-hidden shadow-lg flex flex-col justify-between"
          >
            {/* Photo Card Header */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.userAvatar}
                  alt={photo.userName}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/10"
                />
                <div>
                  <span className="text-xs font-bold text-white block">{photo.userName}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(photo.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {photo.bodyWeightKg && (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[11px] font-semibold text-gray-300">
                    {photo.bodyWeightKg} kg
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-bold border border-[#CCFF00]/20">
                  {photo.type}
                </span>
              </div>
            </div>

            {/* Photo Image */}
            <div className="relative aspect-[4/5] bg-black/40 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.imageUrl}
                alt={photo.caption}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>

            {/* Caption & Partner Reactions */}
            <div className="p-3.5 space-y-2.5 bg-[#121820]/90">
              <p className="text-xs text-gray-200">{photo.caption}</p>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-1">
                  {["🔥", "💪", "⚡"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addReaction(photo.id, emoji)}
                      className="px-2 py-1 rounded-full bg-white/5 hover:bg-white/15 text-xs transition-transform active:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  {photo.reactions.map((r, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white/5 px-2 py-0.5 rounded-full border border-white/5"
                      title={`${r.userName} reacted with ${r.emoji}`}
                    >
                      {r.emoji}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compare Slider Modal */}
      {showCompareModal && data.photos.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#141B24] border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Before &amp; After Comparison</h3>
                <p className="text-xs text-gray-400">Slide to compare condition</p>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Split Screen Image Slider */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden select-none">
              {/* After image (Right / Underneath) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.photos[0].imageUrl}
                alt="After"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <span className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/70 text-[10px] font-bold text-[#CCFF00]">
                TODAY
              </span>

              {/* Before image (Left / Clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.photos[1].imageUrl}
                  alt="Before"
                  className="absolute inset-0 w-full h-full object-cover max-w-none"
                  style={{ width: "100%", height: "100%" }}
                />
                <span className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-black/70 text-[10px] font-bold text-white">
                  DAY 1
                </span>
              </div>

              {/* Slider Line & Thumb */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.8)] pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-[#CCFF00] rounded-full border-2 border-black flex items-center justify-center shadow-lg">
                  <span className="text-[10px] font-black text-black">↔</span>
                </div>
              </div>

              {/* Hidden Range Input overlay */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              />
            </div>
          </div>
        </div>
      )}

      {/* Upload New Photo Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full sm:max-w-md bg-[#141B24] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Upload Progress Snap</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo Selection / Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-video rounded-2xl border-2 border-dashed border-white/15 bg-black/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#CCFF00]/50 transition-colors overflow-hidden"
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <Camera className="w-8 h-8 text-[#CCFF00] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-white">Tap to take photo or choose from library</p>
                  <p className="text-[11px] text-gray-400 mt-1">PNG, JPG, WebP supported</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Type selector */}
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5">Category</label>
              <div className="flex gap-2">
                {(["Pump", "Physique", "Scale", "Meal"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPhotoType(type)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                      photoType === type
                        ? "bg-[#CCFF00] text-black border-[#CCFF00]"
                        : "bg-[#1C2430] text-gray-400 border-white/5"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Body weight */}
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Body Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={bodyWeight || ""}
                onChange={(e) => setBodyWeight(Number(e.target.value))}
                placeholder="75.5"
                className="w-full bg-[#1C2430] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
              />
            </div>

            {/* Caption */}
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Caption / Notes</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Post workout pump feeling crazy..."
                className="w-full bg-[#1C2430] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
              />
            </div>

            <button
              disabled={!previewUrl}
              onClick={handleSavePhoto}
              className="w-full py-3 rounded-full bg-[#CCFF00] disabled:opacity-40 text-black font-bold text-sm shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Post to Duo Vault
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
