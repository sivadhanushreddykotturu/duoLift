import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

let appBuildId = "dev";
let appVersion = "1.0.0";

try {
  const versionPath = path.resolve(process.cwd(), "public/version.json");
  if (fs.existsSync(versionPath)) {
    const raw = JSON.parse(fs.readFileSync(versionPath, "utf-8"));
    if (raw.buildId) appBuildId = raw.buildId;
    if (raw.version) appVersion = raw.version;
  }
} catch {
  // fallback
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_BUILD_ID: appBuildId,
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate, max-age=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/version.json",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate, max-age=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;

