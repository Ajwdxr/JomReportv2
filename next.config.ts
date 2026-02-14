import type { NextConfig } from "next";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.supabase.in", 
      },
      {
         protocol: "https", 
         hostname: "googleusercontent.com", // For Google avatars
      },
      {
         protocol: "https",
         hostname: "**", 
      }
    ],
  },
};

export default withPWA(nextConfig);
