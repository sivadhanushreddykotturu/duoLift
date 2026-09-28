import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import AppUpdater from "@/components/pwa/AppUpdater";
import "./globals.css";

export const metadata: Metadata = {
  title: "DuoLift",
  description: "Minimalist daily workout checklist & progress photos.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: { 
    capable: true, 
    statusBarStyle: "black-translucent", 
    title: "DuoLift" 
  },
};

export const viewport: Viewport = {
  themeColor: "#EBEBEB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        variables: {
          colorPrimary: "#000000",
        },
      }}
    >
      <html lang="en" className="h-full">
        <head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="DuoLift" />
          <link rel="apple-touch-icon" href="/icon-192.png" />
        </head>
        <body className="min-h-full bg-[#EBEBEB] text-[#111111] antialiased selection:bg-black selection:text-white">
          <ServiceWorkerRegister />
          <AppUpdater />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
