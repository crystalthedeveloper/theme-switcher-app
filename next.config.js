// next.config.js
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  output: 'standalone', // 👈 This tells Vercel to deploy your API routes
};

module.exports = nextConfig;