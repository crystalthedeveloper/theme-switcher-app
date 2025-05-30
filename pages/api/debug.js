// pages/api/debug.js
export default function handler(req, res) {
  res.status(200).json({
    WEBFLOW_CLIENT_ID: process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID,
    BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    SECRET: process.env.WEBFLOW_CLIENT_SECRET,
  });
}
