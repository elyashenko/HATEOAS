import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../server/main.js';

// Кэшируем экземпляр Fastify приложения
let app: Awaited<ReturnType<typeof buildApp>> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Инициализируем приложение при первом запросе
  if (!app) {
    app = await buildApp();
  }

  // В catch-all роуте путь передается через req.query.path
  const pathParam = req.query.path as string | string[] | undefined;
  const path = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam || '');
  
  // Строим полный путь с префиксом /api
  // Если путь пустой, используем просто /api
  const fullPath = path ? `/api/${path}` : '/api';
  
  // Добавляем query параметры (исключаем служебный параметр path)
  const queryParams = { ...req.query };
  delete queryParams.path;
  
  const queryString = Object.keys(queryParams)
    .map((key) => {
      const value = queryParams[key];
      if (Array.isArray(value)) {
        return value.map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`).join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .join('&');
  
  const url = queryString ? `${fullPath}?${queryString}` : fullPath;

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
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
