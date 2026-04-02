import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Parent folder has another package-lock.json — wrong root breaks dev on Windows.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  // Fresh output dir avoids EPERM on a locked `.next\dev\logs` (OneDrive / old dev processes).
  distDir: 'next-build',
  // Proxy API to FastAPI so the browser uses same origin (no CORS issues for /upload, /documents, /chat).
  async rewrites() {
    return [
      {
        source: '/api/rag/:path*',
        destination: 'http://127.0.0.1:8000/:path*',
      },
    ];
  },
};

export default nextConfig;
