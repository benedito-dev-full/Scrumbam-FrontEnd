import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server on port 3001 (backend runs on 3000)
  devIndicators: false,
  // Standalone output for Docker containerization
  output: "standalone",
  // Security headers for all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  // Backward compat: rotas antigas /intentions/[projectId] -> /projects/[id]
  // Regex (\\d+) garante que /intentions/inbox e /intentions/new NAO sejam afetados
  // (eles continuam servindo as paginas globais correspondentes).
  async redirects() {
    return [
      {
        source: "/intentions/:projectId(\\d+)",
        destination: "/projects/:projectId",
        permanent: true, // 308
      },
      {
        source: "/intentions/:projectId(\\d+)/:intentionId(\\d+)",
        destination: "/projects/:projectId/issues/:intentionId",
        permanent: true, // 308
      },
    ];
  },
};

export default nextConfig;
