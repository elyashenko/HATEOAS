import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../server/main.js';

let app: Awaited<ReturnType<typeof buildApp>> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathFromQuery = req.query.path;
  const pathSeg = Array.isArray(pathFromQuery) ? pathFromQuery.join('/') : (pathFromQuery as string) || '';
  const fullPath = pathSeg ? `/api/${pathSeg}` : '/api';

  const queryParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.query)) {
    if (k !== 'path' && v != null) {
      queryParams[k] = Array.isArray(v) ? v[0] ?? '' : String(v);
    }
  }
  const qs = Object.keys(queryParams).length
    ? '?' + Object.entries(queryParams).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
    : '';
  const url = fullPath + qs;

  if (!app) {
    try {
      app = await buildApp();
      await app.ready();
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: { code: '500', message: 'Failed to initialize server application' } });
    }
  }

  try {
    const method = (req.method || 'GET').toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    let payload: string | Buffer | undefined;
    if (req.body != null) {
      payload = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
    }
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (v != null) headers[k.toLowerCase()] = Array.isArray(v) ? v[0] : String(v);
    }
    if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && !payload) delete headers['content-type'];

    const r = await app.inject({ method, url, headers, payload });
    res.status(r.statusCode);
    Object.entries(r.headers).forEach(([k, v]) => v != null && res.setHeader(k, v));
    return res.send(r.body);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { code: '500', message: 'A server error has occurred' } });
  }
}
