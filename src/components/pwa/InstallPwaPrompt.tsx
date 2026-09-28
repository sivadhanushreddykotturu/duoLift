"use client";

import React, { useEffect, useState } from "react";
import { Download, Share, X, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone / installed mode
    const isStandaloneMode = 
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari navigator.standalone
      window.navigator.standalone === true;

    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone || dismissed) return null;

  // Don't show if not installable and not iOS
  if (!deferredPrompt && !isIOS) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <div className="bg-black text-white rounded-[32px] p-5 shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shrink-0 shadow-sm">
            <Download className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold tracking-tight">Install DuoLift App</h4>
            <p className="text-xs text-gray-400 truncate">Add to home screen for full PWA</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-4 py-2 bg-white text-black font-bold text-xs rounded-full hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            {isIOS ? "How to Install" : "Install"}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-t-[36px] sm:rounded-[36px] p-6 pb-8 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold tracking-tight">Install on iPhone / iPad</h3>
              <button 
                onClick={() => setShowIOSModal(false)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-5 space-y-4 text-xs font-medium text-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-black">
                  <Share className="w-5 h-5" />
                </div>
                <span>1. Tap the <strong>Share</strong> button in Safari toolbar</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-black">
                  <PlusSquare className="w-5 h-5" />
                </div>
                <span>2. Scroll down and tap <strong>Add to Home Screen</strong></span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3.5 bg-black text-white rounded-2xl text-xs font-bold cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
