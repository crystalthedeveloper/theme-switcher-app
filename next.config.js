// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  output: 'standalone', // ✅ Ensures Vercel treats this as a serverless app (API routes work)
};

module.exports = nextConfig;