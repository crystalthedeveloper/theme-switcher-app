// lib/webflow.js

export async function fetchWebflowSites(accessToken) {
  if (!accessToken) {
    return { success: false, reason: 'Missing access token' };
  }

  try {
    const res = await fetch('https://api.webflow.com/v2/sites', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'accept-version': '2.0.0',
      },
    });

    const raw = await res.text();
    if (raw.startsWith('<')) {
      return { success: false, reason: 'Received HTML instead of JSON' };
    }

    const data = JSON.parse(raw);
    const hostedSites = (data?.sites || []).filter(site => site.plan !== 'developer');

    return hostedSites.length
      ? { success: true, sites: hostedSites }
      : { success: false, reason: 'No hosted sites found' };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}
