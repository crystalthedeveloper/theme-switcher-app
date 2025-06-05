// pages/api/authorize.js

export default async function handler(req, res) {
  const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const redirectUri = `${baseUrl}/callback`;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Missing required environment variables.' });
  }

  const webflowAuthUrl = new URL('https://webflow.com/oauth/authorize');
  webflowAuthUrl.searchParams.set('response_type', 'code');
  webflowAuthUrl.searchParams.set('client_id', clientId);
  webflowAuthUrl.searchParams.set('redirect_uri', redirectUri);

  return res.redirect(webflowAuthUrl.toString());
}
