import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const CSP = [
  "default-src 'self'",
  // Next.js needs unsafe-inline for its own scripts; unsafe-eval for Firebase SDK in dev
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://replicate.delivery",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://firebasestorage.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
  "frame-src https://*.firebaseapp.com https://*.firebase.com",
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "Referrer-Policy",           value: "origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control",    value: "on" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy",   value: CSP },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "replicate.delivery" },
    ],
  },

  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
