// pages/api/authorize.js

export default async function handler(req, res) {
  // Prevent caching
  res.setHeader('Cache-Control', 'no-store');

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const redirectUri = `${baseUrl}/callback`;

  const missingEnv = {
    clientId: !clientId,
    baseUrl: !baseUrl,
  };

  if (Object.values(missingEnv).includes(true)) {
    return res.status(500).json({
      error: 'Missing required environment variables.',
      details: missingEnv,
    });
  }

  // Build the Webflow OAuth URL
  const webflowAuthUrl = new URL('https://webflow.com/oauth/authorize');
  webflowAuthUrl.searchParams.set('response_type', 'code');
  webflowAuthUrl.searchParams.set('client_id', clientId);
  webflowAuthUrl.searchParams.set('redirect_uri', redirectUri);

  return res.redirect(webflowAuthUrl.toString());
}