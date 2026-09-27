"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Photo { url: string; caption?: string; date: string }

interface PartnerData {
  name: string;
  code: string;
  logs: string[];
  photos: Photo[];
}

interface MeData {
  name: string;
  code: string;
  logs: string[];
  photos: Photo[];
  hasPartner: boolean;
  partner: PartnerData | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Last N day keys in order oldest→newest
function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

function dayLabel(dateKey: string) {
  const d = new Date(dateKey + "T12:00:00");
  const today = todayKey();
  if (dateKey === today) return "Today";
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

// Upload to Cloudinary via direct upload
async function uploadToCloudinary(file: File): Promise<string> {
  const res = await fetch("/api/cloudinary/sign", { method: "POST" });
  const { signature, timestamp, folder, apiKey, cloudName } = await res.json();

  const form = new FormData();
  form.append("file", file);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("api_key", apiKey);
  form.append("folder", folder);

  const up = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = await up.json();
  return data.secure_url as string;
}

// ─── Board: 7-day check grid ───────────────────────────────────────────────────

function Board({ me, partner }: { me: MeData; partner: PartnerData | null }) {
  const days = lastNDays(7);
  const today = todayKey();

  return (
    <section>
      {/* Column headers */}
      <div className="grid gap-x-0" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
        <div /> {/* spacer */}
        {days.map((d) => (
          <div
            key={d}
            className={`text-center text-[11px] font-medium pb-3 ${
              d === today ? "text-black" : "text-[#aaa]"
            }`}
          >
            {dayLabel(d)}
          </div>
        ))}

        {/* Me row */}
        <div className="flex items-center pr-3">
          <span className="text-sm font-medium text-black truncate">You</span>
        </div>
        {days.map((d) => {
          const done = me.logs.includes(d);
          return (
            <div key={d} className="flex items-center justify-center py-1">
              <span
                className={`text-lg leading-none ${done ? "opacity-100" : "opacity-10"}`}
                title={done ? "Done" : "Not logged"}
              >
                ✓
              </span>
            </div>
          );
        })}

        {/* Partner row */}
        {partner && (
          <>
            <div className="flex items-center pr-3 pt-3">
              <span className="text-sm font-medium text-black truncate">{partner.name}</span>
            </div>
            {days.map((d) => {
              const done = partner.logs.includes(d);
              return (
                <div key={d} className="flex items-center justify-center py-1 pt-3">
                  <span
                    className={`text-lg leading-none ${done ? "opacity-100" : "opacity-10"}`}
                  >
                    ✓
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}

// ─── Photos grid ───────────────────────────────────────────────────────────────

function PhotosSection({
  me,
  partner,
  onRefresh,
}: {
  me: MeData;
  partner: PartnerData | null;
  onRefresh: () => void;
}) {
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
    } finally {
      setUploading(false);
    }
  };

  // Merge and sort all photos newest first
  const allPhotos = [
    ...me.photos.map((p) => ({ ...p, owner: "You" })),
    ...(partner?.photos ?? []).map((p) => ({ ...p, owner: partner!.name })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section className="space-y-5">
      {/* Upload bar */}
      {previewUrl ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="preview" className="w-full rounded-2xl object-cover" style={{ maxHeight: 260 }} />
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className="w-full border border-[#e5e5e5] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#ccc] bg-white"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setPreviewFile(null); setPreviewUrl(""); }}
              className="flex-1 py-2.5 rounded-xl border border-[#e5e5e5] text-sm text-[#888]"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={uploading}
              className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-medium disabled:opacity-50"
            >
              {uploading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 rounded-xl border border-dashed border-[#ddd] text-sm text-[#aaa] hover:border-[#ccc] transition-colors"
          >
            + Add photo
          </button>
        </>
      )}

      {/* Photo grid */}
      {allPhotos.length === 0 ? (
        <p className="text-sm text-[#bbb] text-center py-8">No photos yet</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {allPhotos.map((p, i) => (
            <div key={i} className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-[#f0f0f0]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-2.5 py-2">
                <p className="text-[11px] font-semibold text-white">{p.owner}</p>
                {p.caption && <p className="text-[10px] text-white/70 truncate">{p.caption}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Add partner section ────────────────────────────────────────────────────────

function AddPartner({ myCode, onPaired }: { myCode: string; onPaired: () => void }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(myCode);
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
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      onPaired();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-8 py-4">
      <div>
        <p className="text-xs text-[#aaa] uppercase tracking-widest font-medium mb-2">Your code</p>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold tracking-widest text-black">{myCode}</span>
          <button
            onClick={copyCode}
            className="text-xs text-[#888] border border-[#e5e5e5] px-3 py-1 rounded-lg"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-[#bbb] mt-1.5">Share this with your gym buddy</p>
      </div>

      <div>
        <p className="text-xs text-[#aaa] uppercase tracking-widest font-medium mb-2">Enter buddy&apos;s code</p>
        <form onSubmit={handlePair} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="ABC123"
            className="flex-1 border border-[#e5e5e5] rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest uppercase outline-none focus:border-[#ccc] bg-white"
          />
          <button
            type="submit"
            disabled={loading || input.length !== 6}
            className="px-5 py-2.5 rounded-xl bg-black text-white text-sm font-medium disabled:opacity-40"
          >
            {loading ? "..." : "Add"}
          </button>
        </form>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    </section>
  );
}

// ─── App shell ─────────────────────────────────────────────────────────────────

type Tab = "board" | "photos" | "you";

export default function Page() {
  const { isLoaded } = useAuth();
  const { user: clerkUser } = useUser();

  const [data, setData] = useState<MeData | null>(null);
  const [tab, setTab] = useState<Tab>("board");
  const [logging, setLogging] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/me");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => { if (isLoaded) load(); }, [isLoaded, load]);

  const today = todayKey();
  const loggedToday = data?.logs.includes(today) ?? false;

  const handleLog = async () => {
    if (loggedToday || logging) return;
    setLogging(true);
    await fetch("/api/log", { method: "POST" });
    await load();
    setLogging(false);
    if ("vibrate" in navigator) navigator.vibrate(40);
  };

  if (!isLoaded || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[#ccc] text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-sm mx-auto">
      {/* Header */}
      <header className="px-5 pt-14 pb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#aaa] font-medium">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-xl font-semibold text-black mt-0.5">
            Hi, {data.name}
          </h1>
        </div>
        <UserButton />
      </header>

      {/* Content */}
      <main className="flex-1 px-5 pb-36 space-y-10">
        {/* Log button — always visible on board tab */}
        {tab === "board" && (
          <button
            onClick={handleLog}
            disabled={loggedToday || logging}
            className={`w-full py-4 rounded-2xl text-base font-semibold transition-all ${
              loggedToday
                ? "bg-[#f0f0f0] text-[#aaa] cursor-default"
                : "bg-black text-white active:scale-[0.98]"
            }`}
          >
            {loggedToday ? "✓  Logged for today" : logging ? "Logging..." : "Log workout"}
          </button>
        )}

        {tab === "board" && (
          <>
            <Board me={data} partner={data.partner} />
            {!data.hasPartner && (
              <div className="text-center py-4">
                <p className="text-sm text-[#aaa]">No buddy yet —</p>
                <button
                  onClick={() => setTab("you")}
                  className="text-sm underline text-black mt-0.5"
                >
                  add one in You tab
                </button>
              </div>
            )}
          </>
        )}

        {tab === "photos" && (
          <PhotosSection me={data} partner={data.partner} onRefresh={load} />
        )}

        {tab === "you" && (
          <section className="space-y-8">
            {/* Partner status */}
            {data.hasPartner && data.partner ? (
              <div>
                <p className="text-xs text-[#aaa] uppercase tracking-widest font-medium mb-2">Buddy</p>
                <p className="text-lg font-semibold text-black">{data.partner.name}</p>
                <p className="text-xs text-[#aaa] mt-0.5">
                  {data.partner.logs.includes(today) ? "✓ Logged today" : "○ Not yet today"}
                </p>
              </div>
            ) : (
              <AddPartner myCode={data.code} onPaired={load} />
            )}

            {/* Your code even if already paired */}
            {data.hasPartner && (
              <div>
                <p className="text-xs text-[#aaa] uppercase tracking-widest font-medium mb-1">Your code</p>
                <p className="text-2xl font-bold tracking-widest text-black">{data.code}</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0">
        <div className="max-w-sm mx-auto px-5 pb-8 pt-3 border-t border-[#efefef] bg-[#FAFAFA]/90 backdrop-blur-sm">
          <div className="flex items-center justify-around">
            {(
              [
                { id: "board" as Tab, label: "Board" },
                { id: "photos" as Tab, label: "Photos" },
                { id: "you" as Tab, label: "You" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                  tab === id ? "bg-black text-white" : "text-[#aaa]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
