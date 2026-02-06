import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../server/main.js';

// Кэшируем экземпляр Fastify приложения
let app: Awaited<ReturnType<typeof buildApp>> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Логируем ВСЕ запросы в самом начале для отладки
  console.log('=== Vercel Handler Called ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', req.body ? (typeof req.body === 'string' ? req.body.substring(0, 200) : JSON.stringify(req.body).substring(0, 200)) : 'null');
  
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
  
  // Сначала проверяем, есть ли полный путь в req.url (для POST запросов это часто так)
  // Например: /api/posts/2/archive
  if (rawUrl.startsWith('/api/') && !rawUrl.includes('?...path=') && !rawUrl.includes('&...path=')) {
    // Если URL уже содержит полный путь /api/..., используем его напрямую
    // Убираем только служебные параметры ...path из query, если они есть
    let cleanUrl = rawUrl;
    if (rawUrl.includes('&...path=') || rawUrl.includes('?...path=')) {
      cleanUrl = rawUrl.replace(/[?&]\.\.\.path=[^&]*/g, '');
      cleanUrl = cleanUrl.replace(/\?$/, '');
    }
    url = cleanUrl;
  } else {
    // В Vercel catch-all routes путь приходит в req.query['...path'] (с тремя точками!)
    // Например: /api/posts/2/archive -> req.query['...path'] может быть строкой "posts/2/archive" или массивом ['posts', '2', 'archive']
    const pathParam = (req.query as any)['...path'] || req.query.path;
    
    if (pathParam) {
      // Обрабатываем массив или строку
      let path: string;
      if (Array.isArray(pathParam)) {
        path = pathParam.join('/');
      } else if (typeof pathParam === 'string') {
        // Если это строка, используем как есть (может быть "posts" или "posts/2/archive")
        path = pathParam;
      } else {
        path = '';
      }
      
      // Формируем полный путь с /api в начале
      const fullPath = path ? `/api/${path}` : '/api';
      
      // Добавляем query параметры (исключаем служебные параметры path и ...path)
      const queryParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.query)) {
        // Пропускаем служебные параметры catch-all route
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
      // Если path нет в query, используем req.url и извлекаем путь
      // Убираем ...path из query параметров, если он есть в URL
      let cleanUrl = rawUrl;
      if (rawUrl.includes('&...path=') || rawUrl.includes('?...path=')) {
        cleanUrl = rawUrl.replace(/[?&]\.\.\.path=[^&]*/g, '');
        cleanUrl = cleanUrl.replace(/\?$/, '');
      }
      
      // Проверяем, является ли URL абсолютным
      if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        const parsed = new URL(cleanUrl);
        url = parsed.pathname + parsed.search;
      } else if (cleanUrl.startsWith('/api')) {
        // Относительный путь, начинающийся с /api
        url = cleanUrl;
      } else if (cleanUrl.startsWith('/')) {
        // Путь начинается с /, но не с /api - добавляем /api
        url = `/api${cleanUrl}`;
      } else {
        // Путь без / - добавляем /api/
        url = `/api/${cleanUrl}`;
      }
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
