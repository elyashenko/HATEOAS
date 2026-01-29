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

  // В Vercel catch-all роуте путь передается через req.query.path
  // Для запроса /api/posts?page=1&size=10:
  // - req.url = '/api/posts?page=1&size=10'
  // - req.query.path = ['posts'] или 'posts'
  // - req.query.page = '1'
  // - req.query.size = '10'
  
  // Используем req.url напрямую, если он начинается с /api
  let url: string;
  if (req.url && req.url.startsWith('/api')) {
    url = req.url;
  } else {
    // Иначе конструируем путь из query параметров
    const pathParam = req.query.path;
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
          // Для массивов используем первый элемент или объединяем
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
    const response = await app.inject({
      method: req.method || 'GET',
      url: url,
      headers: req.headers as Record<string, string>,
      payload: req.body,
    });

    // Устанавливаем статус и заголовки
    res.status(response.statusCode);
    
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
