import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../server/main.js';

// Кэшируем экземпляр Fastify приложения
let app: Awaited<ReturnType<typeof buildApp>> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Логируем ВСЕ запросы в самом начале для отладки
  // Используем JSON.stringify для гарантированного вывода
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    query: req.query,
    queryKeys: Object.keys(req.query),
    pathParam: (req.query as any)['...path'],
    pathParamType: typeof (req.query as any)['...path'],
    pathParamIsArray: Array.isArray((req.query as any)['...path']),
    regularPath: req.query.path,
    hasBody: req.body !== undefined && req.body !== null,
  };
  console.log('=== Vercel Handler Called ===');
  console.log(JSON.stringify(logEntry, null, 2));
  
  // Инициализируем приложение при первом запросе
  if (!app) {
    try {
      console.log('Initializing Fastify app...');
      app = await buildApp();
      console.log('Fastify app initialized successfully');
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
  // Для catch-all routes путь может быть в req.query['...path'] или в req.url
  // Для Fastify.inject нужен только path + query.
  let url: string;
  
  const rawUrl = req.url ?? '';
  
  // В Vercel catch-all routes путь может приходить:
  // 1. В req.query['...path'] как строка или массив (например, "posts/2" или ["posts", "2"])
  // 2. В req.url напрямую как /api/posts/2 (для запросов без query параметров)
  
  const pathParam = (req.query as any)['...path'] || req.query.path;
  
  if (pathParam) {
    // Путь пришел в query параметрах
    let path: string;
    if (Array.isArray(pathParam)) {
      path = pathParam.join('/');
    } else if (typeof pathParam === 'string') {
      path = pathParam;
    } else {
      path = '';
    }
    
    // Формируем полный путь с /api в начале
    const fullPath = path ? `/api/${path}` : '/api';
    
    // Добавляем query параметры (исключаем служебные параметры path и ...path)
    const queryParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'path' && key !== '...path') {
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
    // Если path нет в query, используем req.url напрямую
    // Это работает для запросов типа GET /api/posts/2 или POST /api/posts/2/archive
    let cleanUrl = rawUrl;
    
    // Убираем ...path из query параметров, если он есть
    if (rawUrl.includes('&...path=') || rawUrl.includes('?...path=')) {
      cleanUrl = rawUrl.replace(/[?&]\.\.\.path=[^&]*/g, '');
      cleanUrl = cleanUrl.replace(/\?$/, '');
    }
    
    // Проверяем, является ли URL абсолютным
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      const parsed = new URL(cleanUrl);
      url = parsed.pathname + parsed.search;
    } else if (cleanUrl.startsWith('/api')) {
      // Относительный путь, начинающийся с /api - используем как есть
      url = cleanUrl;
    } else if (cleanUrl.startsWith('/')) {
      // Путь начинается с /, но не с /api - добавляем /api
      url = `/api${cleanUrl}`;
    } else {
      // Путь без / - добавляем /api/
      url = `/api/${cleanUrl}`;
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
  
  // Логируем для отладки (всегда, чтобы видеть что происходит)
  const logData = {
    originalUrl: req.url,
    method: req.method,
    query: req.query,
    queryPath: req.query.path,
    queryPathDots: (req.query as any)['...path'],
    queryPathType: typeof req.query.path,
    queryPathDotsType: typeof (req.query as any)['...path'],
    queryPathIsArray: Array.isArray(req.query.path),
    queryPathDotsIsArray: Array.isArray((req.query as any)['...path']),
    finalUrl: url,
    hasBody: req.body !== undefined && req.body !== null,
    bodyType: req.body ? typeof req.body : 'null',
    contentType: req.headers['content-type'] || req.headers['Content-Type'],
  };
  console.log('Vercel handler:', JSON.stringify(logData, null, 2));

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
    
    // Убеждаемся что Content-Type установлен ТОЛЬКО для POST/PUT/PATCH с телом
    // Для запросов без тела (например, archive) не устанавливаем Content-Type
    if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && payload) {
      if (!headers['content-type']) {
        headers['content-type'] = 'application/json';
      }
    } else if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && !payload) {
      // Для POST/PUT/PATCH без тела удаляем Content-Type, если он был установлен клиентом
      // Это важно для запросов типа archive, которые не требуют тела
      delete headers['content-type'];
    }
    
    // Дополнительное логирование для POST запросов (особенно archive)
    if (method === 'POST' && url.includes('archive')) {
      console.log('Archive request details:', {
        url,
        method,
        payload: payload ? (typeof payload === 'string' ? payload.substring(0, 100) : 'Buffer') : 'undefined',
        headers: Object.keys(headers),
        contentType: headers['content-type'],
      });
    }
    
    const response = await app.inject({
      method: method,
      url: url,
      headers: headers,
      payload: payload,
    });
    
    // Логируем ответ для архивных запросов
    if (method === 'POST' && url.includes('archive')) {
      console.log('Archive response:', {
        statusCode: 'statusCode' in response ? response.statusCode : 'unknown',
        headers: Object.keys(response.headers),
        bodyLength: response.body ? response.body.length : 0,
        bodyPreview: response.body ? String(response.body).substring(0, 200) : 'empty',
      });
    }

    // Устанавливаем статус и заголовки
    const statusCode = 'statusCode' in response ? response.statusCode : 200;
    console.log(`Response status: ${statusCode} for ${method} ${url}`);
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
    console.error('=== ERROR in Vercel Handler ===');
    console.error('Error handling request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Логируем полную информацию об ошибке
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      url: url,
      method: req.method,
      originalUrl: req.url,
      query: req.query,
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
