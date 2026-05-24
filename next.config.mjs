/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    // SSE streams need to flush without buffering
  },
};

export default nextConfig;
