import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../../server/main.js';

// Кэшируем экземпляр Fastify приложения
let app: Awaited<ReturnType<typeof buildApp>> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('=== Posts [id] Handler Called ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('ID:', req.query.id);
  
  // Инициализируем приложение при первом запросе
  if (!app) {
    try {
      app = await buildApp();
    } catch (error) {
      console.error('Failed to initialize Fastify app:', error);
      return res.status(500).json({ 
        error: { 
          code: '500', 
          message: 'Failed to initialize server application' 
        } 
      });
    }
  }

  const id = req.query.id as string;
  const url = `/api/posts/${id}`;
  
  console.log('Forwarding to Fastify:', url);

  try {
    const method = (req.method || 'GET').toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    
    // Подготавливаем payload
    let payload: string | Buffer | undefined = undefined;
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
        payload = req.body;
      } else {
        payload = JSON.stringify(req.body);
      }
    }
    
    // Подготавливаем заголовки
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        const normalizedKey = key.toLowerCase();
        if (Array.isArray(value)) {
          headers[normalizedKey] = value[0];
        } else {
          headers[normalizedKey] = String(value);
        }
      }
    }
    
    // Для POST/PUT/PATCH без тела не устанавливаем Content-Type
    if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && !payload) {
      delete headers['content-type'];
    }
    
    const response = await app.inject({
      method: method,
      url: url,
      headers: headers,
      payload: payload,
    });
    
    const statusCode = 'statusCode' in response ? response.statusCode : 200;
    console.log(`Response status: ${statusCode}`);
    
    res.status(statusCode);
    
    Object.keys(response.headers).forEach((key) => {
      const value = response.headers[key];
      if (value !== undefined) {
        res.setHeader(key, value);
      }
    });

    return res.send(response.body);
  } catch (error) {
    console.error('Error in posts [id] handler:', error);
    return res.status(500).json({ 
      error: { 
        code: '500', 
        message: 'A server error has occurred'
      } 
    });
  }
}
