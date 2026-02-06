import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../server/main.js';

// Кэшируем экземпляр Fastify приложения
let app: Awaited<ReturnType<typeof buildApp>> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  // В Vercel req.url может быть полным URL (https://...) или путём (/api/...).
  // Для catch-all routes путь может быть в req.query.path
  // Для Fastify.inject нужен только path + query.
  let url: string;
  
  // Сначала проверяем query.path (для catch-all routes типа api/[...path].ts)
  const pathParam = req.query.path;
  if (pathParam) {
    let path: string;
    if (Array.isArray(pathParam)) {
      path = pathParam.join('/');
    } else if (typeof pathParam === 'string') {
      path = pathParam;
    } else {
      path = '';
    }
    
    const fullPath = path ? `/api/${path}` : '/api';
    
    // Добавляем query параметры (исключаем служебный параметр path)
    const queryParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'path') {
        if (Array.isArray(value)) {
          queryParams[key] = value[0] || '';
        } else if (value !== undefined) {
          queryParams[key] = String(value);
        }
      }
    }
    
    const queryString = Object.keys(queryParams)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
      .join('&');
    
    url = queryString ? `${fullPath}?${queryString}` : fullPath;
  } else {
    // Если path нет в query, используем req.url
    const rawUrl = req.url ?? '';
    
    // Проверяем, является ли URL абсолютным
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      const parsed = new URL(rawUrl);
      url = parsed.pathname + parsed.search;
    } else if (rawUrl.startsWith('/api')) {
      // Относительный путь, начинающийся с /api
      url = rawUrl;
    } else if (rawUrl.startsWith('/')) {
      // Путь начинается с /, но не с /api - добавляем /api
      url = `/api${rawUrl}`;
    } else {
      // Путь без / - добавляем /api/
      url = `/api/${rawUrl}`;
    }
  }
  
  // Убеждаемся, что URL начинается с /api
  if (!url.startsWith('/api')) {
    if (url.startsWith('/')) {
      url = `/api${url}`;
    } else {
      url = `/api/${url}`;
    }
  }
  
  // Логируем для отладки
  console.log('Vercel handler:', {
    originalUrl: req.url,
    method: req.method,
    query: req.query,
    finalUrl: url,
  });

  // Обрабатываем запрос через Fastify
  try {
    const method = (req.method || 'GET').toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    
    // Подготавливаем payload для Fastify.inject
    // Fastify.inject ожидает строку или Buffer, а не объект
    let payload: string | Buffer | undefined = undefined;
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
        payload = req.body;
      } else {
        // Если это объект, сериализуем в JSON
        payload = JSON.stringify(req.body);
      }
    }
    
    // Подготавливаем заголовки, нормализуем их для Fastify
    const headers: Record<string, string> = {};
    // Копируем заголовки из запроса, нормализуя ключи (Fastify ожидает lowercase)
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        // Fastify ожидает lowercase заголовки
        const normalizedKey = key.toLowerCase();
        if (Array.isArray(value)) {
          headers[normalizedKey] = value[0];
        } else {
          headers[normalizedKey] = String(value);
        }
      }
    }
    
    // Убеждаемся что Content-Type установлен для POST/PUT/PATCH с телом
    if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && payload) {
      if (!headers['content-type']) {
        headers['content-type'] = 'application/json';
      }
    }
    
    const response = await app.inject({
      method: method,
      url: url,
      headers: headers,
      payload: payload,
    });

    // Устанавливаем статус и заголовки
    const statusCode = 'statusCode' in response ? response.statusCode : 200;
    res.status(statusCode);
    
    // Копируем заголовки из ответа Fastify
    Object.keys(response.headers).forEach((key) => {
      const value = response.headers[key];
      if (value !== undefined) {
        res.setHeader(key, value);
      }
    });

    // Отправляем тело ответа
    return res.send(response.body);
  } catch (error) {
    console.error('Error handling request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Логируем полную информацию об ошибке
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      url: url,
      method: req.method,
    });
    
    return res.status(500).json({ 
      error: { 
        code: '500', 
        message: 'A server error has occurred',
        ...(process.env.NODE_ENV !== 'production' && { details: errorMessage })
      } 
    });
  }
}
