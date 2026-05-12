import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source:      '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
      {
        source:      '/auth/:path*',
        destination: 'http://localhost:5000/auth/:path*',
      },
      {
        source:      '/ai-scoring/:path*',
        destination: 'http://localhost:5000/ai-scoring/:path*',
      },
    ];
  },
};

export default nextConfig;