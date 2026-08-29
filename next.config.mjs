/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["mammoth", "xlsx", "tesseract.js"],
  },
};

export default nextConfig;
