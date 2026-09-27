import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DuoLift — Partner Workout & Progress PWA",
    short_name: "DuoLift",
    description: "Daily workout tracking, duo streak accountability, and pump photo vault.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0E13",
    theme_color: "#0A0E13",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
