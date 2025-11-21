// /pages/api/sites.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type ApiBasePath = 'sites' | 'dev-sites';

type WebflowSite = {
  id?: string;
  siteId?: string;
  name?: string;
  displayName?: string;
  workspaceId?: string;
};

type WebflowWorkspace = {
  id?: string;
  name?: string;
  displayName?: string;
  capabilities?: {
    customCodeApiAccess?: boolean;
    custom_code_api_access?: boolean;
    customCode?: { enabled?: boolean };
  };
};

type WebflowListResponse<T> = {
  items?: T[];
  sites?: T[];
};

type SiteEntry = {
  id: string;
  name: string;
  workspaceId: string;
  source: ApiBasePath;
  supportsCustomCodeApi?: boolean;
};

const API_BASE_PATHS: ApiBasePath[] = ['sites', 'dev-sites'];
const WORKSPACES_URL = 'https://api.webflow.com/v2/workspaces';

const buildApiUrl = (basePath: ApiBasePath) => `https://api.webflow.com/v2/${basePath}`;

const safeJson = async (response: Response) => {
  try {
    return await response.json();
  } catch (err) {
    return null;
  }
};

const fetchSitesForPath = async (token: string, basePath: ApiBasePath): Promise<SiteEntry[]> => {
  try {
    const response = await fetch(buildApiUrl(basePath), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '1.0.0',
      },
    });

    if (!response.ok) {
      if (response.status !== 404 && response.status !== 403) {
        const detail = await safeJson(response);
        console.warn(`⚠️ Failed to load ${basePath}`, response.status, detail);
      }
      return [];
    }

    const payload = (await safeJson(response)) as WebflowListResponse<WebflowSite> | null;
    const collection = payload?.items || payload?.sites;
    if (!Array.isArray(collection)) return [];

    return collection
      .map((item) => ({
        id: item.id || item.siteId || '',
        name: item.displayName || item.name || 'Untitled Site',
        workspaceId: item.workspaceId || '',
        source: basePath,
      }))
      .filter((item) => item.id);
  } catch (err) {
    console.warn(`⚠️ Site list fetch failed for ${basePath}`, err);
    return [];
  }
};

const fetchWorkspaces = async (token: string) => {
  try {
    const response = await fetch(WORKSPACES_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'accept-version': '1.0.0',
      },
    });

    if (!response.ok) {
      if (response.status !== 404 && response.status !== 403) {
        const detail = await safeJson(response);
        console.warn('⚠️ Unable to load workspaces', response.status, detail);
      }
      return [];
    }

    const payload = (await safeJson(response)) as WebflowListResponse<WebflowWorkspace> | null;
    const collection = payload?.items || payload?.sites;
    if (!Array.isArray(collection)) return [];

    return collection
      .map((workspace) => {
        const supportsCustomCode =
          !!workspace.capabilities?.customCodeApiAccess ||
          !!workspace.capabilities?.custom_code_api_access ||
          !!workspace.capabilities?.customCode?.enabled;

        return {
          id: workspace.id || '',
          name: workspace.displayName || workspace.name || 'Workspace',
          supportsCustomCodeApi: supportsCustomCode,
        };
      })
      .filter((workspace) => workspace.id);
  } catch (err) {
    console.warn('⚠️ Workspace list fetch failed', err);
    return [];
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(400).json({ success: false, message: 'Missing token' });
  }

  try {
    const [siteResults, workspaceResults] = await Promise.all([
      Promise.all(API_BASE_PATHS.map((path) => fetchSitesForPath(token, path))),
      fetchWorkspaces(token),
    ]);

    const combined = siteResults.flat();
    const uniqueSiteMap = new Map<string, typeof combined[number]>();
    combined.forEach((item) => {
      if (!uniqueSiteMap.has(item.id)) {
        uniqueSiteMap.set(item.id, item);
      }
    });

    const workspaceMap = new Map<
      string,
      { id: string; name: string; supportsCustomCodeApi: boolean; sites: SiteEntry[] }
      >();
    workspaceResults.forEach((workspace) => {
      workspaceMap.set(workspace.id, { ...workspace, sites: [] });
    });

    const ungrouped: typeof sites = [];
    sites.forEach((site) => {
      if (site.workspaceId && workspaceMap.has(site.workspaceId)) {
        const ws = workspaceMap.get(site.workspaceId)!;
        ws.sites.push({ ...site, supportsCustomCodeApi: ws.supportsCustomCodeApi });
      } else {
        ungrouped.push({ ...site, supportsCustomCodeApi: false });
      }
    });

    const workspaces = Array.from(workspaceMap.values()).filter((workspace) => workspace.sites.length > 0);
    const enrichedSites = [
      ...workspaces.flatMap((ws) => ws.sites),
      ...ungrouped,
    ].sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({ success: true, sites: enrichedSites, workspaces, ungrouped });
  } catch (err: any) {
    console.error('⚠️ Unexpected site list error', err);
    return res.status(500).json({ success: false, message: 'Failed to load sites', detail: err?.message || err });
  }
}
