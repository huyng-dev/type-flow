import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export so the app can be packaged as a desktop app (Pake/Tauri).
  output: "export",
};

export default nextConfig;
