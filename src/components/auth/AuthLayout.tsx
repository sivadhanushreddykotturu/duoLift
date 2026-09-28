// src/components/auth/AuthLayout.tsx
import React from "react";
import Image from "next/image";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#EBEBEB] text-[#111111] flex flex-col items-center justify-center px-4 py-10 selection:bg-black selection:text-white relative">
      {/* Decorative ambient background accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-black/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6 z-10">
        <div className="w-16 h-16 bg-black rounded-3xl p-3 shadow-xl border border-white/10 flex items-center justify-center transform transition-transform hover:scale-105 duration-200">
          <Image
            src="/icon-192.png"
            alt="DuoLift Logo"
            width={64}
            height={64}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <h1 className="text-3xl font-medium tracking-tight mt-4 text-black">
          DuoLift
        </h1>
        <p className="text-xs text-gray-500 font-medium tracking-tight mt-1 max-w-xs">
          Minimalist daily workout accountability for pairs.
        </p>

        <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-white/80 backdrop-blur-xs rounded-full border border-gray-200/60 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-black" />
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            2-Person Sync • Shared Streak
          </span>
        </div>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-sm z-10">
        {children}
      </div>

      {/* Footer watermark */}
      <div className="mt-8 text-center text-[11px] text-gray-400 font-medium z-10">
        DuoLift • Built for daily consistency
      </div>
    </main>
  );
}

export const clerkAuthAppearance = {
  elements: {
    rootBox: "w-full shadow-none",
    card: "bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 rounded-[32px] p-6 sm:p-7 w-full",
    headerTitle: "text-xl font-bold tracking-tight text-black text-center",
    headerSubtitle: "text-xs text-gray-400 font-medium text-center mt-1",
    socialButtonsBlockButton: "rounded-2xl border border-gray-200 hover:bg-gray-50 h-12 text-sm font-semibold transition-all shadow-xs",
    socialButtonsBlockButtonText: "font-semibold text-black text-sm",
    dividerLine: "bg-gray-100",
    dividerText: "text-[11px] font-bold text-gray-400 uppercase tracking-widest",
    formFieldLabel: "text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5",
    formFieldInput: "rounded-2xl border border-gray-200 bg-gray-50/60 px-4 h-12 text-sm focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all text-black",
    formButtonPrimary: "rounded-2xl bg-black hover:bg-black/90 active:scale-[0.98] h-12 text-sm font-bold shadow-md transition-all cursor-pointer text-white",
    footerActionLink: "text-black font-bold hover:underline",
    footerActionText: "text-xs text-gray-400 font-medium",
    identityPreviewText: "font-semibold text-black",
    formFieldSuccessText: "text-xs text-emerald-600 font-medium",
    formFieldErrorText: "text-xs text-red-500 font-medium mt-1",
    footer: "bg-transparent border-t border-gray-100 mt-4 pt-4",
  },
};
