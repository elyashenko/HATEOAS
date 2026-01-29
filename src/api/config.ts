/**
 * Конфигурация API
 * Определяет базовый URL для API запросов в зависимости от окружения
 */

/**
 * Получить базовый URL API
 * В продакшене использует относительные URL (same-origin)
 * В разработке использует localhost:3000
 */
export function getApiBaseUrl(): string {
  // В продакшене используем относительные URL (same-origin)
  // Это работает, если фронтенд и бэкенд на одном домене
  if (import.meta.env.PROD) {
    // Для Vercel: если фронтенд и API на одном домене, используем относительный путь
    return '/api';
  }

  // В разработке используем localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
}

/**
 * Получить полный URL для относительных ссылок HATEOAS
 * Используется когда сервер возвращает относительные пути в _links
 */
export function resolveApiUrl(href: string): string {
  // Если ссылка уже абсолютная (начинается с http), возвращаем как есть
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }

  // В продакшене используем относительные URL
  if (import.meta.env.PROD) {
    return href;
  }

  // В разработке добавляем базовый URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}${href}`;
}
