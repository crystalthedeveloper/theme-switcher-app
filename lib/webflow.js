// lib/webflow.js

export async function fetchWebflowSites(accessToken) {
  if (!accessToken) {
    return {
      success: false,
      reason: 'Missing access token for Webflow API request.',
    };
  }

  try {
    const response = await fetch('https://api.webflow.com/v2/sites', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'accept-version': '2.0.0',
      },
    });

    const raw = await response.text();

    // If Webflow returns HTML, it's likely an invalid token or an error page.
    if (raw.startsWith('<')) {
      return {
        success: false,
        reason: 'Received unexpected HTML (invalid or expired token?)',
      };
    }

    const data = JSON.parse(raw);

    const hostedSites = Array.isArray(data?.sites)
      ? data.sites.filter(site => site.plan !== 'developer')
      : [];

    if (hostedSites.length === 0) {
      return {
        success: false,
        reason: 'No hosted (paid) Webflow sites found.',
      };
    }

    return { success: true, sites: hostedSites };
  } catch (error) {
    return {
      success: false,
      reason: `Fetch error: ${error.message}`,
    };
  }
}