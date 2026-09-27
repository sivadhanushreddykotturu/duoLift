import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";

export const metadata: Metadata = {
  title: "DuoLift — Workout & Progress PWA",
  description: "Track workouts, stay consistent with your gym partner, and build your physique together.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DuoLift",
  },
};

export const viewport: Viewport = {
  themeColor: "#090D12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProviderWrapper>
      <html lang="en" className="dark h-full">
        <head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        </head>
        <body className="min-h-full bg-[#090D12] text-gray-100 antialiased selection:bg-[#CCFF00] selection:text-black">
          <ServiceWorkerRegister />
          {children}
        </body>
      </html>
    </ClerkProviderWrapper>
  );
}
