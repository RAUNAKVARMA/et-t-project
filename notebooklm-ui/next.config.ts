import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Parent folder has another package-lock.json — wrong root breaks dev on Windows.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  // Use default distDir `.next` so Vercel finds routes-manifest.json. If Windows EPERM on .next, delete .next and retry.
  // Local dev only: proxy to FastAPI on your machine. On Vercel, set NEXT_PUBLIC_API_URL to your hosted API (Render/Railway).
  async rewrites() {
    if (process.env.VERCEL) {
      return [];
    }
    if (process.env.NEXT_PUBLIC_API_URL?.trim() || process.env.NEXT_PUBLIC_BACKEND_URL?.trim()) {
      return [];
    }
    return [
      {
        source: '/api/rag/:path*',
        destination: 'http://127.0.0.1:8000/:path*',
      },
    ];
  },
};

export default nextConfig;
