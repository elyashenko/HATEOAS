import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../../../server/main.js';

let app: Awaited<ReturnType<typeof buildApp>> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('=== Republish Handler Called ===', req.query.id);
  
  if (!app) {
    try {
      app = await buildApp();
    } catch (error) {
      console.error('Failed to initialize Fastify app:', error);
      return res.status(500).json({ error: { code: '500', message: 'Failed to initialize server application' } });
    }
  }

  const id = req.query.id as string;
  const url = `/api/posts/${id}/republish`;

  try {
    let payload: string | Buffer | undefined = undefined;
    if (req.body !== undefined && req.body !== null) {
      payload = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
    }
    
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        const normalizedKey = key.toLowerCase();
        headers[normalizedKey] = Array.isArray(value) ? value[0] : String(value);
      }
    }
    
    if (req.method === 'POST' && !payload) {
      delete headers['content-type'];
    }
    
    const response = await app.inject({
      method: (req.method || 'POST').toUpperCase() as 'POST',
      url: url,
      headers: headers,
      payload: payload,
    });
    
    res.status('statusCode' in response ? response.statusCode : 200);
    Object.keys(response.headers).forEach((key) => {
      const value = response.headers[key];
      if (value !== undefined) res.setHeader(key, value);
    });
    return res.send(response.body);
  } catch (error) {
    console.error('Error in republish handler:', error);
    return res.status(500).json({ error: { code: '500', message: 'A server error has occurred' } });
  }
}
