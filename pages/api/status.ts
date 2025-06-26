// pages/api/status.ts
export default async function handler(req, res) {
  return res.status(200).json({ status: 'ok', app: 'Theme Switcher', version: '1.0.0' });
}